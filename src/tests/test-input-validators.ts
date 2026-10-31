import assert from "node:assert/strict";
import { validateLogin } from "../validators/auth.validator.js";
import { validateService } from "../validators/service.validator.js";
let total = 0;

function test(description: string, action: () => void) {
  action();
  total++;
  console.log(`OK: ${description}`);
}

function serviceWithPrice(price: unknown) {
  return validateService({
    name: " Corte de cabelo ",
    price,
    duration: 40,
  });
}

for (const [input, expected] of [
  ["60", "60.00"],
  ["60.5", "60.50"],
  [" 60.50 ", "60.50"],
  ["00060.50", "60.50"],
  ["0.01", "0.01"],
]) {
  test(`preço "${input}" normalizado para "${expected}"`, () => {
    const result = serviceWithPrice(input);

    assert.ok(result.data);
    assert.equal(result.data.price, expected);
    assert.equal(result.data.name, "Corte de cabelo");
    assert.equal(result.data.duration, 40);
  });
}

for (const price of [
  "60,50",
  "1e2",
  "0x10",
  "60.999",
  "0.00",
  "-10",
  "",
  "   ",
  60,
  null,
]) {
  test(`preço inválido recusado: ${JSON.stringify(price)}`, () => {
    assert.ok(serviceWithPrice(price).error);
  });
}

for (const duration of [
  0,
  -10,
  30.5,
  "40",
  null,
  Infinity,
  Number.MAX_SAFE_INTEGER + 1,
]) {
  test(`duração inválida recusada: ${String(duration)}`, () => {
    const result = validateService({
      name: "Corte",
      price: "60.00",
      duration,
    });

    assert.ok(result.error);
  });
}

test("serviço sem nome é recusado", () => {
  const result = validateService({
    name: "   ",
    price: "60.00",
    duration: 40,
  });

  assert.ok(result.error);
});

test("login normaliza o e-mail e preserva a senha", () => {
  const result = validateLogin({
    email: "  RESPONSAVEL@EXAMPLE.COM  ",
    password: " senha com espaços ",
  });

  assert.ok(result.data);
  assert.equal(result.data.email, "responsavel@example.com");
  assert.equal(result.data.password, " senha com espaços ");
});

for (const email of ["", "   ", "sem-arroba.com", "nome@dominio", null]) {
  test(`e-mail inválido recusado: ${JSON.stringify(email)}`, () => {
    assert.ok(validateLogin({ email, password: "SenhaTeste123!" }).error);
  });
}

test("login recusa senha vazia", () => {
  assert.ok(
    validateLogin({
      email: "responsavel@example.com",
      password: "",
    }).error,
  );
});

test("login aceita senha com 72 bytes", () => {
  assert.ok(
    validateLogin({
      email: "responsavel@example.com",
      password: "a".repeat(72),
    }).data,
  );
});

test("login recusa senha com 73 bytes", () => {
  assert.ok(
    validateLogin({
      email: "responsavel@example.com",
      password: "a".repeat(73),
    }).error,
  );
});

test("limite da senha considera bytes de caracteres acentuados", () => {
  assert.ok(
    validateLogin({
      email: "responsavel@example.com",
      password: "á".repeat(37),
    }).error,
  );
});

console.log(`Todos os ${total} cenários de validação passaram.`);
