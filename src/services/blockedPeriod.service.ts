import { db } from "../prisma/db.js";
import {
  withScheduleLock,
  type AppointmentTransaction,
} from "../utils/scheduleLock.js";

// Função interna: a gravação exige uma transação já protegida.
async function createBlockedPeriod(
  tx: AppointmentTransaction,
  businessId: number,
  startAt: string,
  endAt: string,
  allDay: boolean,
  reason?: string,
) {
  return tx.orm.public.BlockedPeriod.create({
    businessId,
    startAt,
    endAt,
    allDay,
    reason,
  });
}

// Consulta pública, sem alteração de dados.
export async function getAppointmentsConflictingWithBlock(
  businessId: number,
  startAt: string,
  endAt: string,
) {
  return db.orm.public.Appointment.where({ businessId })
    .where((appointment) => appointment.startAt.lt(endAt))
    .where((appointment) => appointment.endAt.gt(startAt))
    .where({ status: "SCHEDULED" })
    .all();
}

export async function scheduleBlockedPeriod(
  businessId: number,
  startAt: string,
  endAt: string,
  allDay: boolean,
  reason?: string,
) {
  return withScheduleLock(businessId, async (tx) => {
    // A consulta precisa usar a mesma transação da gravação.
    const appointments = await tx.orm.public.Appointment
      .where({ businessId })
      .where((appointment) => appointment.startAt.lt(endAt))
      .where((appointment) => appointment.endAt.gt(startAt))
      .where({ status: "SCHEDULED" })
      .all();

    if (appointments.length > 0) {
      return {
        error: "Existem agendamentos confirmados dentro deste período.",
        appointments,
      };
    }

    const blockedPeriod = await createBlockedPeriod(
      tx,
      businessId,
      startAt,
      endAt,
      allDay,
      reason,
    );

    return {
      data: blockedPeriod,
    };
  });
}

export async function getBlockedPeriodsBetween(
  businessId: number,
  startAt: string,
  endAt: string,
) {
  return db.orm.public.BlockedPeriod.where({ businessId })
    .where((blockedPeriod) => blockedPeriod.startAt.lt(endAt))
    .where((blockedPeriod) => blockedPeriod.endAt.gt(startAt))
    .all();
}

export async function getBlockedPeriods(businessId: number) {
  return db.orm.public.BlockedPeriod.where({ businessId }).all();
}

export async function deleteBlockedPeriod(
  businessId: number,
  id: number,
) {
  return withScheduleLock(businessId, async (tx) => {
    const blockedPeriod = await tx.orm.public.BlockedPeriod
      .where({ businessId })
      .where({ id })
      .first();

    if (!blockedPeriod) {
      return null;
    }

    await tx.orm.public.BlockedPeriod
      .where({ businessId })
      .where({ id })
      .delete();

    return blockedPeriod;
  });
}