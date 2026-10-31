import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { generateAccessToken, verifyAccessToken } from "../utils/token.js";

function main() {
  const secret = process.env["JWT_SECRET"];
  assert.ok(
    secret && secret.length >= 64,
    "Configure JWT_SECRET antes de executar o teste.",
  );

  const ids = { userId: 1, businessId: 2 };
  let checks = 0;

  function sign(
    payload: Record<string, unknown>,
    options: SignOptions = {},
    key: string = secret!,
  ) {
    return jwt.sign(payload, key, {
      algorithm: "HS256",
      expiresIn: "1h",
      issuer: "agendahub-api",
      audience: "agendahub-admin",
      ...options,
    });
  }

  function reject(label: string, token: string) {
    assert.throws(
      () => verifyAccessToken(token),
      (error: unknown) =>
        error instanceof jwt.JsonWebTokenError ||
        (error instanceof Error && error.message === "Token inválido."),
      `O verificador deveria rejeitar: ${label}`,
    );
    checks++;
    console.log(`OK: ${label} rejeitado.`);
  }

  const valid = generateAccessToken(ids);
  assert.deepEqual(verifyAccessToken(valid), ids);
  // Decodificação usada somente para conferir as claims emitidas no teste.
  const decoded = jwt.decode(valid, { complete: true });
  assert.ok(decoded && typeof decoded.payload !== "string");
  assert.equal(decoded.header.alg, "HS256");
  assert.equal(decoded.payload.iss, "agendahub-api");
  assert.equal(decoded.payload.aud, "agendahub-admin");
  assert.equal(typeof decoded.payload.exp, "number");
  assert.equal(typeof decoded.payload.iat, "number");
  assert.equal(decoded.payload.exp! - decoded.payload.iat!, 3600);
  checks++;
  console.log("OK: token válido aceito e emitido com duração de uma hora.");

  reject("token malformado", "token-invalido");
  reject("token expirado", sign(ids, { expiresIn: -60 }));
  reject("token ainda não válido", sign(ids, { notBefore: 300 }));
  reject("emissor incorreto", sign(ids, { issuer: "outro-emissor" }));
  reject("público incorreto", sign(ids, { audience: "outro-publico" }));
  reject("algoritmo HS384", sign(ids, { algorithm: "HS384" }));
  reject(
    "assinatura com outra chave",
    sign(ids, {}, randomBytes(64).toString("hex")),
  );

  const noExpiration = jwt.sign(ids, secret, {
    algorithm: "HS256",
    issuer: "agendahub-api",
    audience: "agendahub-admin",
  });
  reject("token sem expiração", noExpiration);

  const parts = valid.split(".");
  assert.equal(parts.length, 3);
  const alteredPayload = Buffer.from(
    JSON.stringify({ ...decoded.payload, businessId: 999 }),
  ).toString("base64url");
  reject("payload adulterado", `${parts[0]}.${alteredPayload}.${parts[2]}`);
  const unsignedHeader = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  reject("token sem assinatura", `${unsignedHeader}.${parts[1]}.`);

  const invalidIds: Array<[string, Record<string, unknown>]> = [
    ["userId ausente", { businessId: 2 }],
    ["businessId ausente", { userId: 1 }],
    ["userId em texto", { userId: "1", businessId: 2 }],
    ["businessId em texto", { userId: 1, businessId: "2" }],
    ["userId zero", { userId: 0, businessId: 2 }],
    ["businessId negativo", { userId: 1, businessId: -2 }],
    ["userId fracionário", { userId: 1.5, businessId: 2 }],
    ["businessId fracionário", { userId: 1, businessId: 2.5 }],
    [
      "userId fora do intervalo seguro",
      { userId: Number.MAX_SAFE_INTEGER + 1, businessId: 2 },
    ],
    [
      "businessId fora do intervalo seguro",
      { userId: 1, businessId: Number.MAX_SAFE_INTEGER + 1 },
    ],
  ];
  for (const [label, payload] of invalidIds) reject(label, sign(payload));

  console.log(`Todos os ${checks} cenários de JWT passaram.`);
}

try {
  main();
} catch (error) {
  console.error(
    "Teste de JWT falhou:",
    error instanceof Error ? error.message : "Erro desconhecido.",
  );
  process.exitCode = 1;
}
