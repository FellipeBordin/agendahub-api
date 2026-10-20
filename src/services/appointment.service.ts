import { db } from "../prisma/db.js";
import { getAvailabilityByDay } from "./availability.service.js";
import { getBlockedPeriodsBetween } from "./blockedPeriod.service.js";

export async function createAppointment(
  businessId: number,
  clientName: string,
  clientPhone: string,
  startAt: string,
  endAt: string,
  serviceId: number,
) {
  const appointment = await db.orm.public.Appointment.create({
    businessId,
    clientName,
    clientPhone,
    startAt,
    endAt,
    serviceId,
  });

  return appointment;
}

export async function scheduleAppointment(
  businessId: number,
  clientName: string,
  clientPhone: string,
  startAt: string,
  serviceId: number,
) {
  const service = await db.orm.public.Service.where({ businessId })
    .where({ id: serviceId })
    .first();

  if (!service) {
    return {
      error: "Serviço não encontrado.",
    };
  }

  if (!service.active) {
    return {
      error: "Este serviço está indisponível.",
    };
  }

  // Exige data e hora com indicação explícita do fuso.
  const normalizedStartAt = startAt.trim();
  const dateTimeWithTimezone =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

  if (!dateTimeWithTimezone.test(normalizedStartAt)) {
    return {
      error:
        "Informe a data com o fuso horário. Exemplo: 2026-10-21T20:00:00-03:00.",
    };
  }

  const startDate = new Date(normalizedStartAt);

  if (Number.isNaN(startDate.getTime())) {
    return {
      error: "O horário inicial é inválido.",
    };
  }

  if (startDate.getTime() <= Date.now()) {
    return {
      error:
        "Não é possível realizar um agendamento em um horário que já passou.",
    };
  }

  const endDate = new Date(startDate.getTime() + service.duration * 60 * 1000);

  // Interpreta início e término no fuso do negócio.
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const startParts = formatter.formatToParts(startDate);
  const endParts = formatter.formatToParts(endDate);

  function getPart(
    parts: Intl.DateTimeFormatPart[],
    type: Intl.DateTimeFormatPartTypes,
  ) {
    return parts.find((part) => part.type === type)?.value ?? "";
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = weekdays.indexOf(getPart(startParts, "weekday"));

  const availability = await getAvailabilityByDay(businessId, dayOfWeek);

  if (!availability || !availability.active) {
    return {
      error: "Não há atendimento neste dia.",
    };
  }

  const startHour = Number(getPart(startParts, "hour"));
  const startMinute = Number(getPart(startParts, "minute"));
  const startSecond = Number(getPart(startParts, "second"));

  if (
    (startMinute !== 0 && startMinute !== 30) ||
    startSecond !== 0 ||
    startDate.getUTCMilliseconds() !== 0
  ) {
    return {
      error:
        "O horário deve iniciar em intervalos de 30 minutos, sem segundos ou milissegundos.",
    };
  }

  const sameDay = (["year", "month", "day"] as const).every(
    (part) => getPart(startParts, part) === getPart(endParts, part),
  );

  const appointmentStartMinutes = startHour * 60 + startMinute;

  const appointmentEndMinutes =
    Number(getPart(endParts, "hour")) * 60 +
    Number(getPart(endParts, "minute")) +
    Number(getPart(endParts, "second")) / 60;

  const [openHour, openMinute] = availability.startTime.split(":").map(Number);

  const [closeHour, closeMinute] = availability.endTime.split(":").map(Number);

  const openingMinutes = openHour * 60 + openMinute;
  const closingMinutes = closeHour * 60 + closeMinute;

  if (
    !sameDay ||
    appointmentStartMinutes < openingMinutes ||
    appointmentEndMinutes > closingMinutes
  ) {
    return {
      error: "O horário escolhido está fora do horário de atendimento.",
    };
  }

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  const blockedPeriods = await getBlockedPeriodsBetween(
    businessId,
    startISO,
    endISO,
  );

  if (blockedPeriods.length > 0) {
    return {
      error: "Este horário está bloqueado para atendimento.",
    };
  }

  const appointments = await db.orm.public.Appointment.where({ businessId })
    .where((appointment) => appointment.startAt.lt(endISO))
    .where((appointment) => appointment.endAt.gt(startISO))
    .where({ status: "SCHEDULED" })
    .all();

  if (appointments.length > 0) {
    return {
      error: "Este horário não está disponível.",
    };
  }

  const appointment = await createAppointment(
    businessId,
    clientName,
    clientPhone,
    startISO,
    endISO,
    serviceId,
  );

  return {
    data: appointment,
  };
}

export async function getAppointments(businessId: number) {
  const appointments = await db.orm.public.Appointment.where({
    businessId,
  }).all();

  return appointments;
}

export async function getAppointmentById(businessId: number, id: number) {
  const appointment = await db.orm.public.Appointment.where({ businessId })
    .where({ id })
    .first();

  return appointment;
}

export async function updateAppointmentStatus(
  businessId: number,
  id: number,
  status: "SCHEDULED" | "COMPLETED" | "CANCELED",
) {
  const existingAppointment = await getAppointmentById(businessId, id);

  if (!existingAppointment) {
    return {
      error: "Agendamento não encontrado.",
    };
  }

  const isReactivating =
    status === "SCHEDULED" && existingAppointment.status !== "SCHEDULED";

  if (isReactivating) {
    const startDate = new Date(existingAppointment.startAt);
    const endDate = new Date(existingAppointment.endAt);

    if (startDate.getTime() <= Date.now()) {
      return {
        error:
          "Não é possível reativar um agendamento em um horário que já passou.",
      };
    }

    // Converte o dia e o horário para o fuso do negócio.
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });

    const startParts = formatter.formatToParts(startDate);
    const endParts = formatter.formatToParts(endDate);

    function getPart(
      parts: Intl.DateTimeFormatPart[],
      type: Intl.DateTimeFormatPartTypes,
    ) {
      return parts.find((part) => part.type === type)?.value ?? "";
    }

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const dayOfWeek = weekdays.indexOf(getPart(startParts, "weekday"));

    // Consulta o funcionamento atual desse dia.
    const availability = await getAvailabilityByDay(businessId, dayOfWeek);

    if (!availability || !availability.active) {
      return {
        error: "Não é possível reativar: não há atendimento neste dia.",
      };
    }

    const sameDay = (["year", "month", "day"] as const).every(
      (part) => getPart(startParts, part) === getPart(endParts, part),
    );

    const startMinutes =
      Number(getPart(startParts, "hour")) * 60 +
      Number(getPart(startParts, "minute")) +
      Number(getPart(startParts, "second")) / 60;

    const endMinutes =
      Number(getPart(endParts, "hour")) * 60 +
      Number(getPart(endParts, "minute")) +
      Number(getPart(endParts, "second")) / 60;

    const [openHour, openMinute] = availability.startTime
      .split(":")
      .map(Number);

    const [closeHour, closeMinute] = availability.endTime
      .split(":")
      .map(Number);

    const openingMinutes = openHour * 60 + openMinute;
    const closingMinutes = closeHour * 60 + closeMinute;

    // O atendimento inteiro precisa caber no funcionamento.
    if (
      !sameDay ||
      startMinutes < openingMinutes ||
      endMinutes > closingMinutes
    ) {
      return {
        error:
          "Não é possível reativar: o agendamento está fora do horário de atendimento.",
      };
    }

    // Verifica os bloqueios manuais.
    const blockedPeriods = await getBlockedPeriodsBetween(
      businessId,
      startDate.toISOString(),
      endDate.toISOString(),
    );

    if (blockedPeriods.length > 0) {
      return {
        error:
          "Não é possível reativar: este horário está bloqueado para atendimento.",
      };
    }
  }

  if (status === "SCHEDULED") {
    const appointments = await db.orm.public.Appointment.where({ businessId })
      .where((appointment) => appointment.startAt.lt(existingAppointment.endAt))
      .where((appointment) => appointment.endAt.gt(existingAppointment.startAt))
      .where({ status: "SCHEDULED" })
      .all();

    const hasConflict = appointments.some(
      (appointment) => appointment.id !== id,
    );

    if (hasConflict) {
      return {
        error: "Não é possível reativar: este horário já está ocupado.",
      };
    }
  }

  const appointment = await db.orm.public.Appointment.where({ businessId })
    .where({ id })
    .update({ status });

  return {
    data: appointment,
  };
}

export async function getAppointmentsBetween(
  businessId: number,
  startAt: string,
  endAt: string,
) {
  const appointments = await db.orm.public.Appointment.where({ businessId })
    .where((appointment) => appointment.startAt.lt(endAt))
    .where((appointment) => appointment.endAt.gt(startAt))
    .where({ status: "SCHEDULED" })
    .all();

  return appointments;
}
