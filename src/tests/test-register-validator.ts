import assert from "node:assert/strict";
import { validateRegisterBusiness } from "../validators/auth.validator.js";

const validInput = {
  businessName: " GiDesign ",
  slug: " GIDESIGN ",
  userName: " Fellipe Bordin ",
  email: " RESPONSAVEL@EXAMPLE.COM ",
  password: "SenhaTeste123!",
};

let total = 0;

function test(description: string, action: () => void) {
  action();
  total++;
  console.log(`OK: ${description}`);
}

test("cadastro válido normaliza os dados", () => {
  const result = validateRegisterBusiness(validInput);

  assert.ok(result.data);
  assert.deepEqual(result.data, {
    businessName: "GiDesign",
    slug: "gidesign",
    userName: "Fellipe Bordin",
    email: "responsavel@example.com",
    password: "SenhaTeste123!",
  });
});

for (const slug of ["gidesign", "salao-teste", "studio-123"]) {
  test(`slug válido aceito: ${slug}`, () => {
    assert.ok(validateRegisterBusiness({ ...validInput, slug }).data);
  });
}

for (const slug of [
  "",
  "   ",
  "-gidesign",
  "gidesign-",
  "gi--design",
  "gi design",
  "salão",
  "gi_design",
  "gi/design",
  null,
]) {
  test(`slug inválido recusado: ${JSON.stringify(slug)}`, () => {
    assert.ok(validateRegisterBusiness({ ...validInput, slug }).error);
  });
}

for (const businessName of ["", "   ", null]) {
  test(`nome do negócio inválido: ${JSON.stringify(businessName)}`, () => {
    assert.ok(validateRegisterBusiness({ ...validInput, businessName }).error);
  });
}

for (const userName of ["", "   ", "A", null]) {
  test(`nome do responsável inválido: ${JSON.stringify(userName)}`, () => {
    assert.ok(validateRegisterBusiness({ ...validInput, userName }).error);
  });
}

for (const email of [
  "",
  "nome@dominio",
  "sem-arroba.com",
  `${"a".repeat(243)}@example.com`,
  null,
]) {
  test(`e-mail inválido recusado: ${JSON.stringify(email)}`, () => {
    assert.ok(validateRegisterBusiness({ ...validInput, email }).error);
  });
}

for (const password of ["", "1234567", null]) {
  test("senha ausente ou curta é recusada", () => {
    assert.ok(validateRegisterBusiness({ ...validInput, password }).error);
  });
}

test("senha com 8 caracteres é aceita", () => {
  assert.ok(
    validateRegisterBusiness({
      ...validInput,
      password: "Teste123",
    }).data,
  );
});

test("senha com 72 bytes é aceita", () => {
  assert.ok(
    validateRegisterBusiness({
      ...validInput,
      password: "a".repeat(72),
    }).data,
  );
});

test("senha com 73 bytes é recusada", () => {
  assert.ok(
    validateRegisterBusiness({
      ...validInput,
      password: "a".repeat(73),
    }).error,
  );
});

test("senha acentuada acima de 72 bytes é recusada", () => {
  assert.ok(
    validateRegisterBusiness({
      ...validInput,
      password: "á".repeat(37),
    }).error,
  );
});

test("espaços da senha são preservados", () => {
  const password = " SenhaTeste123! ";
  const result = validateRegisterBusiness({
    ...validInput,
    password,
  });

  assert.ok(result.data);
  assert.equal(result.data.password, password);
});

console.log(`Todos os ${total} cenários de cadastro passaram.`);
