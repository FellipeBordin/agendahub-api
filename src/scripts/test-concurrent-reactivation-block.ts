import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../prisma/db.js";
import {
  scheduleAppointment,
  updateAppointmentStatus,
} from "../services/appointment.service.js";
import { scheduleBlockedPeriod } from "../services/blockedPeriod.service.js";

async function main() {
  let testBusinessId: number | undefined;

  try {
    // Escolhe uma data futura, sete dias à frente.
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 7);

    const date = future.toISOString().slice(0, 10);
    const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();

    const startAt = `${date}T10:00:00-03:00`;
    const endAt = `${date}T11:00:00-03:00`;

    const business = await db.orm.public.Business.create({
      name: "Teste de concorrência com bloqueio",
      slug: `teste-bloqueio-${randomUUID()}`,
      active: true,
    });

    testBusinessId = business.id;

    const service = await db.orm.public.Service.create({
      businessId: business.id,
      name: "Serviço de teste",
      price: "60.00",
      duration: 60,
      active: true,
    });

    await db.orm.public.Availability.create({
      businessId: business.id,
      dayOfWeek,
      startTime: "09:00",
      endTime: "18:00",
      active: true,
    });

    // Prepara um agendamento cancelado para tentar reativá-lo.
    const original = await scheduleAppointment(
      business.id,
      "Cliente de teste de reativação",
      "11999999999",
      startAt,
      service.id,
    );

    if ("error" in original) {
      throw new Error(original.error);
    }

    const appointmentId = original.data.id;

    const cancellation = await updateAppointmentStatus(
      business.id,
      appointmentId,
      "CANCELED",
    );
    if ("error" in cancellation) {
      throw new Error(cancellation.error);
    }

    assert.ok(cancellation.data, "O cancelamento não retornou o agendamento.");

    assert.equal(
      cancellation.data.status,
      "CANCELED",
      "O agendamento precisa estar cancelado antes da disputa.",
    );
    const [appointmentAttempt, blockAttempt] = await Promise.allSettled([
      updateAppointmentStatus(business.id, appointmentId, "SCHEDULED"),
      scheduleBlockedPeriod(
        business.id,
        startAt,
        endAt,
        false,
        "Bloqueio concorrente com reativação",
      ),
    ]);

    if (appointmentAttempt.status === "rejected") {
      throw appointmentAttempt.reason;
    }

    if (blockAttempt.status === "rejected") {
      throw blockAttempt.reason;
    }

    const appointmentResult = appointmentAttempt.value;
    const blockResult = blockAttempt.value;

    console.log("Resultado da reativação:");
    console.log(appointmentResult);

    console.log("Resultado do bloqueio:");
    console.log(blockResult);

    const appointmentCreated = "data" in appointmentResult;
    const blockCreated = "data" in blockResult;

    assert.equal(
      Number(appointmentCreated) + Number(blockCreated),
      1,
      "Exatamente uma operação deveria ser aceita.",
    );

    if ("error" in appointmentResult) {
      assert.equal(
        appointmentResult.error,
        "Não é possível reativar: este horário está bloqueado para atendimento.",
      );
    }

    if ("error" in blockResult) {
      assert.equal(
        blockResult.error,
        "Existem agendamentos confirmados dentro deste período.",
      );
    }

    // Confere também os registros efetivamente salvos no banco.
    const appointments = await db.orm.public.Appointment.where({
      businessId: business.id,
    })
      .where({ status: "SCHEDULED" })
      .all();

    const blocks = await db.orm.public.BlockedPeriod.where({
      businessId: business.id,
    }).all();

    assert.equal(appointments.length, appointmentCreated ? 1 : 0);
    assert.equal(blocks.length, blockCreated ? 1 : 0);

    console.log(
      "OK: apenas uma operação foi aceita, sem reserva sobreposta ao bloqueio.",
    );
  } finally {
    if (testBusinessId !== undefined) {
      const businessId = testBusinessId;

      // Remove somente os dados do negócio criado por este teste.
      await db.transaction(async (tx) => {
        await tx.orm.public.Appointment.where({ businessId }).delete();
        await tx.orm.public.BlockedPeriod.where({ businessId }).delete();
        await tx.orm.public.Availability.where({ businessId }).delete();
        await tx.orm.public.Service.where({ businessId }).delete();
        await tx.orm.public.Business.where({ id: businessId }).delete();
      });

      console.log("Dados de teste removidos.");
    }
  }
}

main()
  .catch((error) => {
    console.error("Teste falhou:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
