import assert from "node:assert/strict";

const url = "http://localhost:3000/api/auth/login";

async function check(
  body: string,
  expectedStatus: number,
  expectedError: string,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    signal: AbortSignal.timeout(15_000),
  });

  assert.equal(response.status, expectedStatus);
  assert.match(
    response.headers.get("content-type") ?? "",
    /application\/json/i,
  );

  assert.deepEqual(await response.json(), {
    error: expectedError,
  });
}

async function main() {
  await check(
    '{"email":',
    400,
    "O corpo da requisição contém um JSON inválido.",
  );

  console.log("OK: JSON malformado retorna 400.");

  await check(
    JSON.stringify({ content: "a".repeat(110 * 1024) }),
    413,
    "O corpo da requisição excede o limite permitido de 100 KB.",
  );

  console.log("OK: JSON acima do limite retorna 413.");
  console.log("Os 2 cenários de tratamento do corpo passaram.");
}

main().catch((error) => {
  console.error("Teste falhou:", error);
  process.exitCode = 1;
});
