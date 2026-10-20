import { db } from "../prisma/db.js";

export async function createBlockedPeriod(
  businessId: number,
  startAt: string,
  endAt: string,
  allDay: boolean,
  reason?: string,
) {
  const blockedPeriod = await db.orm.public.BlockedPeriod.create({
    businessId,
    startAt,
    endAt,
    allDay,
    reason,
  });

  return blockedPeriod;
}

export async function getAppointmentsConflictingWithBlock(
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

export async function scheduleBlockedPeriod(
  businessId: number,
  startAt: string,
  endAt: string,
  allDay: boolean,
  reason?: string,
) {
  const appointments = await getAppointmentsConflictingWithBlock(
    businessId,
    startAt,
    endAt,
  );

  if (appointments.length > 0) {
    return {
      error: "Existem agendamentos confirmados dentro deste período.",
      appointments,
    };
  }

  const blockedPeriod = await createBlockedPeriod(
    businessId,
    startAt,
    endAt,
    allDay,
    reason,
  );

  return {
    data: blockedPeriod,
  };
}

export async function getBlockedPeriodsBetween(
  businessId: number,
  startAt: string,
  endAt: string,
) {
  const blockedPeriods = await db.orm.public.BlockedPeriod.where({ businessId })
    .where((blockedPeriod) => blockedPeriod.startAt.lt(endAt))
    .where((blockedPeriod) => blockedPeriod.endAt.gt(startAt))
    .all();

  return blockedPeriods;
}

export async function getBlockedPeriods(businessId: number) {
  const blockedPeriods = await db.orm.public.BlockedPeriod.where({
    businessId,
  }).all();

  return blockedPeriods;
}
export async function deleteBlockedPeriod(businessId: number, id: number) {
  const blockedPeriod = await db.orm.public.BlockedPeriod.where({ businessId })
    .where({ id })
    .first();

  if (!blockedPeriod) {
    return null;
  }

  await db.orm.public.BlockedPeriod.where({ businessId })
    .where({ id })
    .delete();

  return blockedPeriod;
}
