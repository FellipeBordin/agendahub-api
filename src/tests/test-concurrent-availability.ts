import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../prisma/db.js";
import { scheduleAppointment } from "../services/appointment.service.js";
import { updateAvailability } from "../services/availability.service.js";

async function main() {
  let testBusinessId: number | undefined;

  try {
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 7);

    const date = future.toISOString().slice(0, 10);
    const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
    const startAt = `${date}T10:00:00-03:00`;

    const business = await db.orm.public.Business.create({
      name: "Teste de concorrência com funcionamento",
      slug: `teste-funcionamento-${randomUUID()}`,
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

    // As duas operações disputam a mesma trava do negócio.
    const [appointmentAttempt, availabilityAttempt] = await Promise.allSettled([
      scheduleAppointment(
        business.id,
        "Cliente de teste",
        "11999999999",
        startAt,
        service.id,
      ),
      updateAvailability(business.id, dayOfWeek, "10:30", "18:00"),
    ]);

    if (appointmentAttempt.status === "rejected") {
      throw appointmentAttempt.reason;
    }

    if (availabilityAttempt.status === "rejected") {
      throw availabilityAttempt.reason;
    }

    const appointmentResult = appointmentAttempt.value;
    const availabilityResult = availabilityAttempt.value;

    console.log("Resultado do agendamento:");
    console.log(appointmentResult);

    console.log("Resultado da alteração de funcionamento:");
    console.log(availabilityResult);

    const appointmentCreated =
      "data" in appointmentResult && appointmentResult.data != null;

    const availabilityUpdated =
      "data" in availabilityResult && availabilityResult.data != null;

    assert.equal(
      Number(appointmentCreated) + Number(availabilityUpdated),
      1,
      "Exatamente uma operação deveria ser aceita.",
    );

    if ("error" in appointmentResult) {
      assert.equal(
        appointmentResult.error,
        "O horário escolhido está fora do horário de atendimento.",
      );
    }

    if ("error" in availabilityResult) {
      assert.equal(availabilityResult.statusCode, 409);

      assert.equal(
        availabilityResult.error,
        "Não é possível alterar o funcionamento: existem agendamentos ativos fora do novo horário.",
      );
    }

    // Verifica o estado realmente salvo no banco.
    const appointments = await db.orm.public.Appointment.where({
      businessId: business.id,
    })
      .where({ status: "SCHEDULED" })
      .all();

    const availability = await db.orm.public.Availability.where({
      businessId: business.id,
    })
      .where({ dayOfWeek })
      .first();

    assert.ok(availability, "A disponibilidade deveria existir.");

    assert.equal(
      appointments.length,
      appointmentCreated ? 1 : 0,
      "A quantidade de agendamentos salvos está incorreta.",
    );

    assert.equal(
      availability.startTime,
      availabilityUpdated ? "10:30" : "09:00",
      "O funcionamento salvo não corresponde ao resultado.",
    );

    assert.equal(availability.endTime, "18:00");

    console.log(
      "OK: apenas uma operação foi aceita, sem reserva fora do funcionamento.",
    );

    console.log("\nTestando funcionamento alterado antes da reserva...");

    // Remove apenas as reservas deste negócio de teste.
    await db.orm.public.Appointment.where({ businessId: business.id }).delete();

    // Agora a mudança deve ser permitida, pois não há reservas.
    const changedAvailability = await updateAvailability(
      business.id,
      dayOfWeek,
      "10:30",
      "18:00",
    );

    assert.ok(
      changedAvailability.data,
      "A alteração de funcionamento deveria ser aceita.",
    );

    assert.equal(changedAvailability.data.startTime, "10:30");

    // Tenta reservar antes da nova abertura.
    const rejectedAppointment = await scheduleAppointment(
      business.id,
      "Cliente antes da abertura",
      "11999999999",
      startAt,
      service.id,
    );

    assert.equal(
      rejectedAppointment.error,
      "O horário escolhido está fora do horário de atendimento.",
    );

    // Confirma que a tentativa não deixou registro no banco.
    const remainingAppointments = await db.orm.public.Appointment.where({
      businessId: business.id,
    }).all();

    assert.equal(
      remainingAppointments.length,
      0,
      "Nenhum agendamento deveria ter sido criado.",
    );

    console.log(
      "OK: a reserva foi recusada após a alteração do funcionamento.",
    );
  } finally {
    if (testBusinessId !== undefined) {
      const businessId = testBusinessId;

      await db.transaction(async (tx) => {
        await tx.orm.public.Appointment.where({ businessId }).delete();
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
