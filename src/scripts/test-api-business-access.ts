import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../prisma/db.js";
import { hashPassword } from "../utils/password.js";
import { generateAccessToken } from "../utils/token.js";

const BASE_URL = "http://localhost:3000/api";
const testBusinessIds: number[] = [];
let checks = 0;

async function request(
  method: string,
  path: string,
  expectedStatus: number,
  token?: string,
  body?: Record<string, unknown>,
) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const options: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(15_000),
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();
  assert.equal(
    response.status,
    expectedStatus,
    `${method} ${path}: esperado ${expectedStatus}, recebido ${response.status}. Resposta: ${text}`,
  );
  const result: unknown = JSON.parse(text);
  checks++;
  return result;
}

function asObject(value: unknown): Record<string, unknown> {
  assert.ok(
    value !== null && typeof value === "object" && !Array.isArray(value),
  );
  return value as Record<string, unknown>;
}

async function createFixture(
  passwordHash: string,
  startAt: string,
  endAt: string,
) {
  const unique = randomUUID();
  const fixture = await db.transaction(async (tx) => {
    const business = await tx.orm.public.Business.create({
      name: `Negócio de teste ${unique}`,
      slug: `teste-acesso-${unique}`,
      active: true,
    });
    const user = await tx.orm.public.User.create({
      businessId: business.id,
      name: "Administrador de teste",
      email: `teste-${unique}@example.com`,
      passwordHash,
      active: true,
    });
    const service = await tx.orm.public.Service.create({
      businessId: business.id,
      name: `Serviço de teste ${unique}`,
      price: "60.00",
      duration: 60,
      active: true,
    });
    // Fixture: testa autorização, não as regras de criação de agendamentos.
    const appointment = await tx.orm.public.Appointment.create({
      businessId: business.id,
      serviceId: service.id,
      clientName: `Cliente de teste ${unique}`,
      clientPhone: "11999999999",
      startAt,
      endAt,
      status: "SCHEDULED",
    });
    const availability = await tx.orm.public.Availability.create({
      businessId: business.id,
      dayOfWeek: new Date(startAt).getUTCDay(),
      startTime: "09:00",
      endTime: "18:00",
      active: true,
    });
    const blockStart = new Date(
      new Date(endAt).getTime() + 3_600_000,
    ).toISOString();
    const blockEnd = new Date(
      new Date(blockStart).getTime() + 3_600_000,
    ).toISOString();
    const block = await tx.orm.public.BlockedPeriod.create({
      businessId: business.id,
      startAt: blockStart,
      endAt: blockEnd,
      allDay: false,
      reason: `Bloqueio de teste ${unique}`,
    });
    return { business, user, service, appointment, availability, block };
  });
  testBusinessIds.push(fixture.business.id);
  return {
    ...fixture,
    token: generateAccessToken({
      userId: fixture.user.id,
      businessId: fixture.business.id,
    }),
  };
}

async function main() {
  try {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 7);
    start.setUTCHours(13, 0, 0, 0);
    const startAt = start.toISOString();
    const endAt = new Date(start.getTime() + 3_600_000).toISOString();
    const passwordHash = await hashPassword(randomUUID());
    const a = await createFixture(passwordHash, startAt, endAt);
    const b = await createFixture(passwordHash, startAt, endAt);
    const slugA = a.business.slug;

    // Confirma que a API acessa o mesmo banco e aceita os tokens de teste.
    for (const fixture of [a, b]) {
      const service = asObject(
        await request(
          "GET",
          `/services/${fixture.business.slug}/${fixture.service.id}`,
          200,
        ),
      );
      assert.equal(service.name, fixture.service.name);
      const appointment = asObject(
        await request(
          "GET",
          `/appointments/${fixture.business.slug}/${fixture.appointment.id}`,
          200,
          fixture.token,
        ),
      );
      assert.equal(appointment.id, fixture.appointment.id);
      assert.equal(appointment.businessId, fixture.business.id);
    }
    console.log("OK: cada administrador acessa seu próprio negócio.");

    const serviceBody = {
      name: "Tentativa de alteração indevida",
      price: "99.00",
      duration: 30,
    };

    const protectedRoutes: Array<{
      method: string;
      path: string;
      body?: Record<string, unknown>;
    }> = [
      { method: "GET", path: `/appointments/${slugA}` },
      { method: "GET", path: `/appointments/${slugA}/${a.appointment.id}` },
      {
        method: "PATCH",
        path: `/appointments/${slugA}/${a.appointment.id}/status`,
        body: { status: "CANCELED" },
      },
      { method: "POST", path: `/services/${slugA}`, body: serviceBody },
      {
        method: "PUT",
        path: `/services/${slugA}/${a.service.id}`,
        body: serviceBody,
      },
      {
        method: "PATCH",
        path: `/services/${slugA}/${a.service.id}/status`,
        body: { active: false },
      },
      {
        method: "POST",
        path: `/availability/${slugA}`,
        body: {
          dayOfWeek: (a.availability.dayOfWeek + 1) % 7,
          startTime: "09:00",
          endTime: "18:00",
        },
      },
      {
        method: "PATCH",
        path: `/availability/${slugA}`,
        body: {
          dayOfWeek: a.availability.dayOfWeek,
          startTime: "08:00",
          endTime: "19:00",
        },
      },
      {
        method: "POST",
        path: `/blocked-periods/${slugA}`,
        body: {
          startAt: a.block.startAt,
          endAt: a.block.endAt,
          allDay: false,
          reason: "Tentativa indevida",
        },
      },
      { method: "GET", path: `/blocked-periods/${slugA}` },
      { method: "DELETE", path: `/blocked-periods/${slugA}/${a.block.id}` },
    ];

    for (const route of protectedRoutes) {
      await request(route.method, route.path, 401, undefined, route.body);
      await request(
        route.method,
        route.path,
        401,
        "token-invalido",
        route.body,
      );
      await request(route.method, route.path, 403, b.token, route.body);
    }
    console.log(
      "OK: rotas administrativas recusam ausência de token, token inválido e outro negócio.",
    );

    // Slug autorizado com IDs de outro negócio deve resultar em 404.
    await request(
      "GET",
      `/appointments/${slugA}/${b.appointment.id}`,
      404,
      a.token,
    );
    await request(
      "PATCH",
      `/appointments/${slugA}/${b.appointment.id}/status`,
      404,
      a.token,
      { status: "CANCELED" },
    );
    await request("GET", `/services/${slugA}/${b.service.id}`, 404);
    await request(
      "PUT",
      `/services/${slugA}/${b.service.id}`,
      404,
      a.token,
      serviceBody,
    );
    await request(
      "PATCH",
      `/services/${slugA}/${b.service.id}/status`,
      404,
      a.token,
      { active: false },
    );
    await request(
      "DELETE",
      `/blocked-periods/${slugA}/${b.block.id}`,
      404,
      a.token,
    );
    console.log(
      "OK: trocar o ID não permite consultar ou alterar registros de outro negócio.",
    );

    const foreignServiceBooking = asObject(
      await request("POST", `/appointments/${slugA}`, 400, undefined, {
        clientName: "Teste serviço de outro negócio",
        clientPhone: "11999999999",
        startAt,
        serviceId: b.service.id,
      }),
    );
    assert.equal(foreignServiceBooking.error, "Serviço não encontrado.");
    console.log(
      "OK: cadastro público recusa serviço pertencente a outro negócio.",
    );

    const foreignServiceSlots = asObject(
      await request(
        "GET",
        `/availability/${slugA}/slots?date=${startAt.slice(0, 10)}&serviceId=${b.service.id}`,
        400,
      ),
    );
    assert.equal(foreignServiceSlots.error, "Serviço não encontrado.");

    // Verifica também o estado final, não apenas os códigos HTTP.
    for (const fixture of [a, b]) {
      const services = await db.orm.public.Service.where({
        businessId: fixture.business.id,
      }).all();
      assert.equal(services.length, 1);
      const service = services[0];
      assert.ok(service);
      assert.equal(service.name, fixture.service.name);
      assert.equal(service.duration, 60);
      assert.equal(service.active, true);

      const appointments = await db.orm.public.Appointment.where({
        businessId: fixture.business.id,
      }).all();
      assert.equal(appointments.length, 1);
      assert.equal(appointments[0]?.status, "SCHEDULED");

      const listed = await request(
        "GET",
        `/appointments/${fixture.business.slug}`,
        200,
        fixture.token,
      );
      assert.ok(Array.isArray(listed));
      assert.equal(listed.length, 1);
      assert.equal(asObject(listed[0]).id, fixture.appointment.id);
      assert.equal(asObject(listed[0]).businessId, fixture.business.id);

      const availabilities = await db.orm.public.Availability.where({
        businessId: fixture.business.id,
      }).all();
      assert.equal(availabilities.length, 1);
      assert.equal(availabilities[0]?.startTime, "09:00");
      assert.equal(availabilities[0]?.endTime, "18:00");

      const blocks = await db.orm.public.BlockedPeriod.where({
        businessId: fixture.business.id,
      }).all();
      assert.equal(blocks.length, 1);
      assert.equal(blocks[0]?.id, fixture.block.id);

      const listedBlocks = await request(
        "GET",
        `/blocked-periods/${fixture.business.slug}`,
        200,
        fixture.token,
      );
      assert.ok(Array.isArray(listedBlocks));
      assert.equal(listedBlocks.length, 1);
      assert.equal(asObject(listedBlocks[0]).id, fixture.block.id);
      assert.equal(asObject(listedBlocks[0]).businessId, fixture.business.id);

      const publicSlots = asObject(
        await request(
          "GET",
          `/availability/${fixture.business.slug}/slots?date=${startAt.slice(0, 10)}&serviceId=${fixture.service.id}`,
          200,
        ),
      );
      assert.ok(Array.isArray(publicSlots.slots));
      assert.ok(publicSlots.slots.includes("09:00"));
      assert.ok(!publicSlots.slots.includes("10:00"));
      assert.ok(!publicSlots.slots.includes("12:00"));
    }
    console.log(
      "OK: listagens isoladas e nenhuma alteração indevida persistida.",
    );

    const mismatchedToken = generateAccessToken({
      userId: a.user.id,
      businessId: b.business.id,
    });
    await request("GET", `/appointments/${slugA}`, 401, mismatchedToken);

    await db.orm.public.User.where({ businessId: a.business.id })
      .where({ id: a.user.id })
      .update({ active: false });
    await request("GET", `/appointments/${slugA}`, 401, a.token);
    await db.orm.public.User.where({ businessId: a.business.id })
      .where({ id: a.user.id })
      .update({ active: true });
    await request("GET", `/appointments/${slugA}`, 200, a.token);

    await db.orm.public.Business.where({ id: a.business.id }).update({
      active: false,
    });
    await request("GET", `/appointments/${slugA}`, 403, a.token);
    console.log(
      "OK: token com vínculo incompatível, usuário inativo e negócio inativo são recusados.",
    );
    console.log(
      `Todos os cenários deste script passaram (${checks} respostas HTTP verificadas).`,
    );
  } finally {
    for (const businessId of testBusinessIds) {
      await db.transaction(async (tx) => {
        await tx.orm.public.Appointment.where({ businessId }).deleteAll();
        await tx.orm.public.BlockedPeriod.where({ businessId }).deleteAll();
        await tx.orm.public.Availability.where({ businessId }).deleteAll();
        await tx.orm.public.Service.where({ businessId }).deleteAll();
        await tx.orm.public.User.where({ businessId }).deleteAll();
        await tx.orm.public.Business.where({ id: businessId }).delete();
      });
    }
    if (testBusinessIds.length > 0) console.log("Dados de teste removidos.");
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
