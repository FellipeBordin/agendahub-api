import { db } from "../prisma/db.js";

export type AppointmentTransaction =
  Parameters<Parameters<typeof db.transaction>[0]>[0];

// Deve ser o mesmo para todas as operações da agenda.
const SCHEDULE_LOCK_NAMESPACE = 74001;

export async function withScheduleLock<T>(
  businessId: number,
  action: (tx: AppointmentTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      db.raw.sql`SET TRANSACTION ISOLATION LEVEL READ COMMITTED`
        .affectedCount()
        .build(),
    );

    await tx.execute(
      db.raw.sql`SELECT pg_advisory_xact_lock(${SCHEDULE_LOCK_NAMESPACE}::integer, ${businessId}::integer)`
        .affectedCount()
        .build(),
    );

    return action(tx);
  });
}