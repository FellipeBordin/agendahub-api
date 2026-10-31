import assert from "node:assert/strict";

const url = "http://localhost:3000/api/appointments/gidesign";

async function sendAppointment(number: number) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientName: `Teste simultâneo ${number}`,
      clientPhone: "11999999999",
      startAt: "2026-10-28T09:00:00-03:00",
      serviceId: 1,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const body = await response.json();

  return {
    request: number,
    status: response.status,
    body,
  };
}

async function main() {
  const results = await Promise.all([sendAppointment(1), sendAppointment(2)]);

  for (const result of results) {
    console.log(`Requisição ${result.request}: ${result.status}`);
    console.log(result.body);
  }

  const created = results.filter((result) => result.status === 201);

  const conflicts = results.filter(
    (result) =>
      [400, 409].includes(result.status) &&
      result.body?.error === "Este horário não está disponível.",
  );

  assert.equal(created.length, 1, "Deveria criar apenas um agendamento.");
  assert.equal(conflicts.length, 1, "Deveria recusar a reserva concorrente.");

  console.log("OK: um agendamento criado e uma reserva recusada.");
}

main().catch((error) => {
  console.error("Teste falhou:", error);
  process.exitCode = 1;
});
