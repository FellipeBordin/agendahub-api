import { db } from "../prisma/db.js";
import { withScheduleLock } from "../utils/scheduleLock.js";

const businessDateFormatter = new Intl.DateTimeFormat("en-US", {
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

function getBusinessDateParts(value: string) {
  const date = new Date(value);
  const parts = businessDateFormatter.formatToParts(date);

  function getPart(type: Intl.DateTimeFormatPartTypes) {
    return parts.find((part) => part.type === type)?.value ?? "";
  }

  return {
    dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      getPart("weekday"),
    ),
    date: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
    minutes:
      Number(getPart("hour")) * 60 +
      Number(getPart("minute")) +
      Number(getPart("second")) / 60 +
      date.getUTCMilliseconds() / 60_000,
  };
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export async function createAvailability(
  businessId: number,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
) {
  return withScheduleLock(businessId, async (tx) => {
    const existingAvailability = await tx.orm.public.Availability.where({
      businessId,
    })
      .where({ dayOfWeek })
      .first();

    if (existingAvailability) {
      return {
        error: "Já existe uma disponibilidade cadastrada para este dia.",
        statusCode: 409 as const,
      };
    }

    const availability = await tx.orm.public.Availability.create({
      businessId,
      dayOfWeek,
      startTime,
      endTime,
    });

    return { data: availability };
  });
}

export async function getAvailabilityByDay(
  businessId: number,
  dayOfWeek: number,
) {
  return db.orm.public.Availability.where({ businessId })
    .where({ dayOfWeek })
    .first();
}

export async function updateAvailability(
  businessId: number,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
) {
  return withScheduleLock(businessId, async (tx) => {
    const existingAvailability = await tx.orm.public.Availability.where({
      businessId,
    })
      .where({ dayOfWeek })
      .first();

    if (!existingAvailability) {
      return {
        error: "Não há disponibilidade cadastrada para este dia.",
        statusCode: 404 as const,
      };
    }

    // Também inclui atendimentos em andamento: ainda não terminaram.
    const now = new Date().toISOString();
    const appointments = await tx.orm.public.Appointment.where({ businessId })
      .where({ status: "SCHEDULED" })
      .where((appointment) => appointment.endAt.gt(now))
      .all();

    const openingMinutes = timeToMinutes(startTime);
    const closingMinutes = timeToMinutes(endTime);

    const conflicts = appointments.filter((appointment) => {
      const start = getBusinessDateParts(appointment.startAt);
      if (start.dayOfWeek !== dayOfWeek) return false;

      const end = getBusinessDateParts(appointment.endAt);
      return (
        start.date !== end.date ||
        start.minutes < openingMinutes ||
        end.minutes > closingMinutes
      );
    });

    if (conflicts.length > 0) {
      return {
        error:
          "Não é possível alterar o funcionamento: existem agendamentos ativos fora do novo horário.",
        statusCode: 409 as const,
        appointments: conflicts.map((appointment) => ({
          id: appointment.id,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
        })),
      };
    }

    // Captura os valores anteriores dentro da mesma transação.
    const previous = {
      dayOfWeek: existingAvailability.dayOfWeek,
      startTime: existingAvailability.startTime,
      endTime: existingAvailability.endTime,
    };

    const availability = await tx.orm.public.Availability.where({ businessId })
      .where({ dayOfWeek })
      .update({ startTime, endTime });

    if (!availability) {
      return {
        error: "Não há disponibilidade cadastrada para este dia.",
        statusCode: 404 as const,
      };
    }

    return { data: availability, previous };
  });
}

export async function getAvailabilities(businessId: number) {
  const availabilities = await db.orm.public.Availability.where({
    businessId,
  }).all();

  return availabilities.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}
