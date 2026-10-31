import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../prisma/db.js";
import {
  scheduleAppointment,
  updateAppointmentStatus,
  getAppointmentById,
} from "../services/appointment.service.js";
import {
  updateService,
  updateServiceStatus,
} from "../services/service.service.js";

// Espera as duas operações terminarem antes de propagar qualquer erro.
async function settlePair<A, B>(
  first: Promise<A>,
  second: Promise<B>,
): Promise<[A, B]> {
  const [a, b] = await Promise.allSettled([first, second]);
  if (a.status === "rejected") throw a.reason;
  if (b.status === "rejected") throw b.reason;
  return [a.value, b.value];
}

function durationInMinutes(appointment: { startAt: string; endAt: string }) {
  return (
    (new Date(appointment.endAt).getTime() -
      new Date(appointment.startAt).getTime()) /
    60_000
  );
}

async function main() {
  let testBusinessId: number | undefined;

  try {
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 7);
    const date = future.toISOString().slice(0, 10);
    const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
    const at = (time: string) => `${date}T${time}:00-03:00`;

    const business = await db.orm.public.Business.create({
      name: "Teste automatizado de serviços",
      slug: `teste-servico-${randomUUID()}`,
      active: true,
    });
    testBusinessId = business.id;

    const service = await db.orm.public.Service.create({
      businessId: business.id,
      name: "Serviço de teste",
      price: "60.00",
      duration: 40,
      active: true,
    });

    await db.orm.public.Availability.create({
      businessId: business.id,
      dayOfWeek,
      startTime: "09:00",
      endTime: "18:00",
      active: true,
    });

    const reserve = (time: string) =>
      scheduleAppointment(
        business.id,
        "Cliente de teste",
        "11999999999",
        at(time),
        service.id,
      );

    const setActive = async (active: boolean) => {
      const updated = await updateServiceStatus(
        business.id,
        service.id,
        active,
      );
      assert.ok(updated, "O serviço deveria existir.");
      assert.equal(updated.active, active);
      return updated;
    };

    const setDuration = async (duration: number) => {
      const updated = await updateService(
        business.id,
        service.id,
        "Serviço de teste",
        "60.00",
        duration,
      );
      assert.ok(updated, "O serviço deveria existir.");
      assert.equal(updated.duration, duration);
      return updated;
    };

    const readAppointment = async (id: number) => {
      const appointment = await getAppointmentById(business.id, id);
      assert.ok(appointment, "O agendamento deveria existir.");
      return appointment;
    };

    const countScheduled = async () => {
      const rows = await db.orm.public.Appointment.where({
        businessId: business.id,
      })
        .where({ status: "SCHEDULED" })
        .all();
      return rows.length;
    };

    const clearTestAppointments = async () => {
      await db.orm.public.Appointment.where({
        businessId: business.id,
      }).deleteAll();

      const remaining = await db.orm.public.Appointment.where({
        businessId: business.id,
      }).all();

      assert.equal(
        remaining.length,
        0,
        "A limpeza entre os cenários deixou agendamentos no banco.",
      );
    };

    // 1. Mudança de duração preserva reservas anteriores.
    const originalResult = await reserve("10:00");
    assert.ok(originalResult.data, "A primeira reserva deveria ser criada.");
    const originalId = originalResult.data.id;
    const originalStart = new Date(originalResult.data.startAt).getTime();
    const originalEnd = new Date(originalResult.data.endAt).getTime();
    assert.equal(durationInMinutes(originalResult.data), 40);

    await setDuration(60);
    let original = await readAppointment(originalId);
    assert.equal(new Date(original.startAt).getTime(), originalStart);
    assert.equal(new Date(original.endAt).getTime(), originalEnd);

    const newResult = await reserve("14:00");
    assert.ok(newResult.data, "A nova reserva deveria ser criada.");
    assert.equal(
      durationInMinutes(await readAppointment(newResult.data.id)),
      60,
    );
    console.log("OK 1: reserva antiga mantém 40 minutos; nova reserva usa 60.");

    // 2. Desativação impede novas reservas e consulta de status é preservada.
    await setActive(false);
    const inactiveResult = await reserve("16:00");
    assert.equal(inactiveResult.error, "Este serviço está indisponível.");
    assert.equal(await countScheduled(), 2);
    assert.equal((await readAppointment(originalId)).status, "SCHEDULED");
    assert.equal(
      (await readAppointment(newResult.data.id)).status,
      "SCHEDULED",
    );
    console.log(
      "OK 2: serviço inativo recusa reserva sem cancelar as existentes.",
    );

    // 3. Serviço inativo impede reativação, sem mudar o status no banco.
    const cancellation = await updateAppointmentStatus(
      business.id,
      originalId,
      "CANCELED",
    );
    assert.ok(cancellation.data);
    assert.equal((await readAppointment(originalId)).status, "CANCELED");

    const refusedReactivation = await updateAppointmentStatus(
      business.id,
      originalId,
      "SCHEDULED",
    );
    assert.equal(
      refusedReactivation.error,
      "Não é possível reativar: este serviço está indisponível.",
    );
    assert.equal((await readAppointment(originalId)).status, "CANCELED");
    console.log("OK 3: serviço inativo impede reativação.");

    // 4. Reativação após ativar o serviço mantém o intervalo original.
    await setActive(true);
    const reactivation = await updateAppointmentStatus(
      business.id,
      originalId,
      "SCHEDULED",
    );
    assert.ok(reactivation.data);
    original = await readAppointment(originalId);
    assert.equal(original.status, "SCHEDULED");
    assert.equal(new Date(original.startAt).getTime(), originalStart);
    assert.equal(new Date(original.endAt).getTime(), originalEnd);
    console.log("OK 4: reativação mantém os 40 minutos originais.");

    // Somente reservas do negócio exclusivo deste teste são removidas.
    await clearTestAppointments();

    // 5. Reserva e alteração de duração: ambas podem ser aceitas.
    await setDuration(40);
    const [durationRace] = await settlePair(reserve("10:00"), setDuration(60));
    assert.ok(
      durationRace.data,
      `A reserva concorrente não foi criada: ${JSON.stringify(durationRace)}`,
    );
    const racedAppointment = await readAppointment(durationRace.data.id);
    const racedDuration = durationInMinutes(racedAppointment);
    assert.ok(
      racedDuration === 40 || racedDuration === 60,
      "A reserva deve usar integralmente a duração anterior ou a nova.",
    );
    assert.equal(await countScheduled(), 1);
    const finalService = await db.orm.public.Service.where({
      businessId: business.id,
    })
      .where({ id: service.id })
      .first();
    assert.ok(finalService);
    assert.equal(finalService.duration, 60);
    console.log(
      `OK 5: reserva concorrente com mudança de duração usou ${racedDuration} minutos.`,
    );

    await clearTestAppointments();

    // 6. Se a reserva vier primeiro, ela permanece marcada após desativar.
    // Se a desativação vier primeiro, a reserva deve ser recusada.
    const [disableRace] = await settlePair(reserve("10:00"), setActive(false));
    if (disableRace.data) {
      assert.equal(
        (await readAppointment(disableRace.data.id)).status,
        "SCHEDULED",
      );
      assert.equal(await countScheduled(), 1);
      console.log(
        "OK 6: reserva venceu a disputa e permaneceu marcada após desativar.",
      );
    } else {
      assert.equal(disableRace.error, "Este serviço está indisponível.");
      assert.equal(await countScheduled(), 0);
      console.log(
        "OK 6: desativação venceu a disputa e a reserva foi recusada.",
      );
    }
    assert.equal(
      (await reserve("16:00")).error,
      "Este serviço está indisponível.",
    );

    await clearTestAppointments();

    // 7. Reativação e desativação também compartilham a mesma trava.
    await setActive(true);
    const preparation = await reserve("10:00");
    assert.ok(preparation.data);
    const reactivationId = preparation.data.id;
    const canceled = await updateAppointmentStatus(
      business.id,
      reactivationId,
      "CANCELED",
    );
    assert.ok(canceled.data);
    assert.equal((await readAppointment(reactivationId)).status, "CANCELED");

    const [reactivationRace] = await settlePair(
      updateAppointmentStatus(business.id, reactivationId, "SCHEDULED"),
      setActive(false),
    );

    if (reactivationRace.data) {
      assert.equal((await readAppointment(reactivationId)).status, "SCHEDULED");
      console.log(
        "OK 7: reativação venceu a disputa e a reserva permaneceu marcada.",
      );
    } else {
      assert.equal(
        reactivationRace.error,
        "Não é possível reativar: este serviço está indisponível.",
      );
      assert.equal((await readAppointment(reactivationId)).status, "CANCELED");
      console.log(
        "OK 7: desativação venceu a disputa e a reativação foi recusada.",
      );
    }

    console.log("Todos os cenários deste script passaram.");
  } finally {
    if (testBusinessId !== undefined) {
      const businessId = testBusinessId;
      await db.transaction(async (tx) => {
        await tx.orm.public.Appointment.where({ businessId }).deleteAll();
        await tx.orm.public.Availability.where({ businessId }).deleteAll();
        await tx.orm.public.Service.where({ businessId }).deleteAll();
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
