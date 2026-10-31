import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

async function main() {
  const suffix = randomUUID();

  const data = {
    businessName: "Teste de cadastro simultâneo",
    slug: `teste-simultaneo-${suffix}`,
    userName: "Responsável Teste",
    email: `teste-${suffix}@example.com`,
    password: `Teste-${randomUUID()}!`,
  };

  async function sendRegistration() {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const body: unknown = await response.json();

    return {
      status: response.status,
      body,
    };
  }

  const results = await Promise.all([sendRegistration(), sendRegistration()]);

  for (const [index, result] of results.entries()) {
    console.log(`Requisição ${index + 1}:`, result.status);
    console.log(result.body);
  }

  const statuses = results.map((result) => result.status).sort((a, b) => a - b);

  assert.deepEqual(
    statuses,
    [201, 409],
    "Esperávamos um cadastro criado e uma duplicidade recusada.",
  );

  console.log("OK: uma requisição retornou 201 e a outra, 409.");
  console.log("Negócio de teste criado:", data.slug);
}

main().catch((error: unknown) => {
  console.error(
    "Teste falhou:",
    error instanceof Error ? error.message : "Erro desconhecido.",
  );

  process.exitCode = 1;
});
