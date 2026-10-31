import assert from "node:assert/strict";
import { parseDateTime } from "../utils/parseDateTime.js";
import { validateAppointment } from "../validators/appointment.validator.js";
import { validateAvailability } from "../validators/availability.validator.js";
import { validateBlockedPeriod } from "../validators/blockedPeriod.validator.js";

let total = 0;

function test(description: string, action: () => void) {
  action();
  total++;
  console.log(`OK: ${description}`);
}

test("horários equivalentes em UTC e -03:00 representam o mesmo instante", () => {
  const local = parseDateTime("2026-11-04T10:00:00-03:00");
  const utc = parseDateTime("2026-11-04T13:00:00Z");

  assert.ok(local);
  assert.ok(utc);
  assert.equal(local.getTime(), utc.getTime());
});

test("29 de fevereiro é aceito em ano bissexto", () => {
  assert.ok(parseDateTime("2028-02-29T10:00:00-03:00"));
});

for (const value of [
  "2026-02-29T10:00:00-03:00",
  "2026-02-30T10:00:00-03:00",
  "2026-04-31T10:00:00-03:00",
  "2026-13-01T10:00:00-03:00",
  "2026-11-04T24:00:00-03:00",
  "2026-11-04T10:60:00-03:00",
  "2026-11-04T10:00:60-03:00",
  "2026-11-04T10:00:00",
  "2026-11-04",
  "04/11/2026",
  "2026-11-04T10:00:00+14:30",
  "2026-11-04T10:00:00-03:60",
]) {
  test(`data inválida recusada: ${value}`, () => {
    assert.equal(parseDateTime(value), null);
  });
}

const appointmentInput = {
  clientName: " Cliente Teste ",
  clientPhone: "11999999999",
  startAt: "2026-11-04T10:00:00-03:00",
  serviceId: 1,
};

test("agendamento válido preserva o horário informado", () => {
  const result = validateAppointment(appointmentInput);

  assert.ok(result.data);
  assert.equal(result.data.clientName, "Cliente Teste");
  assert.equal(result.data.startAt, appointmentInput.startAt);
});

test("agendamento recusa data inexistente", () => {
  const result = validateAppointment({
    ...appointmentInput,
    startAt: "2026-02-30T10:00:00-03:00",
  });

  assert.ok(result.error);
});

test("agendamento recusa ID fora do intervalo seguro", () => {
  const result = validateAppointment({
    ...appointmentInput,
    serviceId: Number.MAX_SAFE_INTEGER + 1,
  });

  assert.ok(result.error);
});

test("disponibilidade válida é aceita", () => {
  assert.ok(
    validateAvailability({
      dayOfWeek: 3,
      startTime: "09:00",
      endTime: "21:00",
    }).data,
  );
});

for (const dayOfWeek of [-1, 7, 1.5, "3", null]) {
  test(`dia da semana inválido recusado: ${JSON.stringify(dayOfWeek)}`, () => {
    assert.ok(
      validateAvailability({
        dayOfWeek,
        startTime: "09:00",
        endTime: "21:00",
      }).error,
    );
  });
}

for (const startTime of ["9:00", "24:00", "09:60", "abc"]) {
  test(`horário de funcionamento inválido recusado: ${startTime}`, () => {
    assert.ok(
      validateAvailability({
        dayOfWeek: 3,
        startTime,
        endTime: "21:00",
      }).error,
    );
  });
}

for (const endTime of ["09:00", "08:00"]) {
  test(`funcionamento recusa término às ${endTime} com início às 09:00`, () => {
    assert.ok(
      validateAvailability({
        dayOfWeek: 3,
        startTime: "09:00",
        endTime,
      }).error,
    );
  });
}

const blockInput = {
  startAt: "2026-11-04T10:00:00-03:00",
  endAt: "2026-11-04T11:00:00-03:00",
};

test("bloqueio comum normaliza os horários para UTC", () => {
  const result = validateBlockedPeriod({
    ...blockInput,
    reason: " Compromisso ",
  });

  assert.ok(result.data);
  assert.equal(result.data.startAt, "2026-11-04T13:00:00.000Z");
  assert.equal(result.data.endAt, "2026-11-04T14:00:00.000Z");
  assert.equal(result.data.allDay, false);
  assert.equal(result.data.reason, "Compromisso");
});

test("bloqueio recusa data inexistente", () => {
  assert.ok(
    validateBlockedPeriod({
      ...blockInput,
      startAt: "2026-02-30T10:00:00-03:00",
    }).error,
  );
});

test("bloqueio compara os instantes considerando o fuso", () => {
  // 10h em -03:00 equivale a 13h UTC; 12h UTC é anterior.
  assert.ok(
    validateBlockedPeriod({
      ...blockInput,
      endAt: "2026-11-04T12:00:00Z",
    }).error,
  );
});

test("bloqueio recusa início e fim iguais", () => {
  assert.ok(
    validateBlockedPeriod({
      ...blockInput,
      endAt: blockInput.startAt,
    }).error,
  );
});

test("allDay deve ser booleano", () => {
  assert.ok(
    validateBlockedPeriod({
      ...blockInput,
      allDay: "true",
    }).error,
  );
});

test("motivo deve ser texto", () => {
  assert.ok(
    validateBlockedPeriod({
      ...blockInput,
      reason: 123,
    }).error,
  );
});

test("motivo vazio é normalizado para undefined", () => {
  const result = validateBlockedPeriod({
    ...blockInput,
    reason: "   ",
  });

  assert.ok(result.data);
  assert.equal(result.data.reason, undefined);
});

test("dia inteiro considera a data local quando a entrada está em UTC", () => {
  const result = validateBlockedPeriod({
    startAt: "2026-11-05T01:00:00Z",
    endAt: "2026-11-05T02:00:00Z",
    allDay: true,
  });

  assert.ok(result.data);
  assert.equal(result.data.allDay, true);
  assert.equal(result.data.startAt, "2026-11-04T03:00:00.000Z");
  assert.equal(result.data.endAt, "2026-11-05T03:00:00.000Z");
});

test("dia inteiro funciona na virada do ano", () => {
  const result = validateBlockedPeriod({
    startAt: "2026-12-31T10:00:00-03:00",
    endAt: "2026-12-31T11:00:00-03:00",
    allDay: true,
  });

  assert.ok(result.data);
  assert.equal(result.data.startAt, "2026-12-31T03:00:00.000Z");
  assert.equal(result.data.endAt, "2027-01-01T03:00:00.000Z");
});

test("dia inteiro funciona no dia bissexto", () => {
  const result = validateBlockedPeriod({
    startAt: "2028-02-29T10:00:00-03:00",
    endAt: "2028-02-29T11:00:00-03:00",
    allDay: true,
  });

  assert.ok(result.data);
  assert.equal(result.data.startAt, "2028-02-29T03:00:00.000Z");
  assert.equal(result.data.endAt, "2028-03-01T03:00:00.000Z");
});

console.log(`Todos os ${total} cenários da agenda passaram.`);
