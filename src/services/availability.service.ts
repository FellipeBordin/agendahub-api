import { db } from "../prisma/db.js";

export async function createAvailability(
  businessId: number,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
) {
  const availability = await db.orm.public.Availability.create({
    businessId,
    dayOfWeek,
    startTime,
    endTime,
  });

  return availability;
}

export async function getAvailabilityByDay(
  businessId: number,
  dayOfWeek: number,
) {
  const availability = await db.orm.public.Availability.where({ businessId })
    .where({ dayOfWeek })
    .first();

  return availability;
}

export async function updateAvailability(
  businessId: number,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
) {
  const availability = await db.orm.public.Availability.where({ businessId })
    .where({ dayOfWeek })
    .update({
      startTime,
      endTime,
    });

  return availability;
}
