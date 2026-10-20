import { db } from "../prisma/db.js";
import { getAvailabilityByDay } from "./availability.service.js";
import { getAppointmentsBetween } from "./appointment.service.js";
import { getBlockedPeriodsBetween } from "./blockedPeriod.service.js";

const BUSINESS_TIMEZONE_OFFSET = "-03:00";
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number,
) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const openingMinutes = startHour * 60 + startMinute;
  const closingMinutes = endHour * 60 + endMinute;

  const slots: string[] = [];

  for (
    let currentMinutes = openingMinutes;
    currentMinutes + duration <= closingMinutes;
    currentMinutes += 30
  ) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;

    const formattedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    slots.push(formattedTime);
  }
  return slots;
}

export async function getAvailableSlots(
  businessId: number,
  date: string,
  serviceId: number,
) {
  const service = await db.orm.public.Service.where({ businessId })
    .where({ id: serviceId })
    .first();

  if (!service) {
    return { error: "Serviço não encontrado." };
  }

  if (!service.active) {
    return { error: "Este serviço está indisponível." };
  }

  const [year, month, day] = date.split("-").map(Number);

  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  const availability = await getAvailabilityByDay(businessId, dayOfWeek);

  if (!availability || !availability.active) {
    return { error: "Não há atendimento neste dia." };
  }

  const slots = generateTimeSlots(
    availability.startTime,
    availability.endTime,
    service.duration,
  );
  const dayStart = `${date}T00:00:00${BUSINESS_TIMEZONE_OFFSET}`;

  // Usa UTC apenas para calcular a próxima data do calendário.
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDateString = nextDate.toISOString().slice(0, 10);

  const dayEnd = `${nextDateString}T00:00:00${BUSINESS_TIMEZONE_OFFSET}`;
  const appointments = await getAppointmentsBetween(
    businessId,
    new Date(dayStart).toISOString(),
    new Date(dayEnd).toISOString(),
  );

  const blockedPeriods = await getBlockedPeriodsBetween(
    businessId,
    new Date(dayStart).toISOString(),
    new Date(dayEnd).toISOString(),
  );

  const now = new Date();
  const availableSlots = slots.filter((slot) => {
    const slotStart = new Date(`${date}T${slot}:00${BUSINESS_TIMEZONE_OFFSET}`);

    if (slotStart <= now) {
      return false;
    }

    const slotEnd = new Date(
      slotStart.getTime() + service.duration * 60 * 1000,
    );

    const hasBlockedPeriodConflict = blockedPeriods.some((blockedPeriod) => {
      const blockedStart = new Date(blockedPeriod.startAt);
      const blockedEnd = new Date(blockedPeriod.endAt);

      return slotStart < blockedEnd && slotEnd > blockedStart;
    });

    const hasConflict = appointments.some((appointment) => {
      const appointmentStart = new Date(appointment.startAt);
      const appointmentEnd = new Date(appointment.endAt);

      return slotStart < appointmentEnd && slotEnd > appointmentStart;
    });

    return !hasConflict && !hasBlockedPeriodConflict;
  });

  return {
    slots: availableSlots,
  };
}
