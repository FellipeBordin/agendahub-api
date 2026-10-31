import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000/api/auth";

async function send(path: string) {
  // Corpo vazio: a validação deve retornar 400 antes de consultar o banco.
  // Não cria usuários, não faz login e não precisa de credenciais.
  const response = await fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  return { response, text };
}

async function checkLimit(
  path: string,
  limit: number,
  windowSeconds: number,
  expectedMessage: string,
) {
  for (let attempt = 1; attempt <= limit; attempt++) {
    const { response, text } = await send(path);
    assert.equal(
      response.status,
      400,
      `${path}, tentativa ${attempt}: esperado 400, recebido ${response.status}: ${text}. Reinicie a API antes de iniciar o teste, para zerar as cotas locais.`,
    );
  }

  const { response, text } = await send(path);
  assert.equal(
    response.status,
    429,
    `${path}: a tentativa ${limit + 1} deveria ser bloqueada. Resposta: ${text}`,
  );
  assert.ok(response.headers.get("content-type")?.includes("application/json"));
  assert.deepEqual(JSON.parse(text), { error: expectedMessage });

  const retryAfter = response.headers.get("retry-after");
  assert.ok(
    retryAfter && /^\d+$/.test(retryAfter),
    "Retry-After deve informar segundos.",
  );
  assert.ok(Number(retryAfter) > 0 && Number(retryAfter) <= windowSeconds);
  assert.ok(response.headers.get("ratelimit"), "Cabeçalho RateLimit ausente.");
  assert.ok(
    response.headers.get("ratelimit-policy"),
    "Cabeçalho RateLimit-Policy ausente.",
  );
  console.log(
    `OK: ${path} bloqueou a tentativa ${limit + 1} com 429, JSON e Retry-After.`,
  );
}

async function main() {
  await checkLimit(
    "login",
    10,
    15 * 60,
    "Muitas tentativas de login. Aguarde e tente novamente mais tarde.",
  );

  // O login já está bloqueado, mas o cadastro ainda tem sua própria cota.
  await checkLimit(
    "register",
    5,
    60 * 60,
    "Muitas tentativas de cadastro. Aguarde e tente novamente mais tarde.",
  );

  const stillBlocked = await send("login");
  assert.equal(stillBlocked.response.status, 429);
  console.log("OK: cadastro e login usam cotas independentes.");
  console.log("Todos os cenários deste teste de rate limit passaram.");
  console.log(
    "Reinicie a API local para liberar as cotas antes de voltar a fazer login.",
  );
}

main().catch((error) => {
  console.error("Teste falhou:", error);
  process.exitCode = 1;
});
