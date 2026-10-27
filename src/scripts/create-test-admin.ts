import { db } from "../prisma/db.js";
import { hashPassword } from "../utils/password.js";

async function main() {
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error("Escolha uma senha com pelo menos 12 caracteres.");
  }

  const business = await db.orm.public.Business.where({
    slug: "gidesign",
  }).first();

  if (!business || !business.active) {
    throw new Error("O negócio gidesign não foi encontrado ou está inativo.");
  }

  const email = "admin.gidesign@example.com";

  const existingUser = await db.orm.public.User.where({ email }).first();

  if (existingUser) {
    throw new Error(
      "Esse e-mail já está cadastrado. Nenhum dado foi alterado.",
    );
  }

  await db.orm.public.User.create({
    name: "Administrador de Teste",
    email,
    passwordHash: await hashPassword(password),
    businessId: business.id,
    active: true,
  });

  console.log("Usuário criado!");
  console.log("E-mail:", email);
  console.log("Negócio:", business.slug);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
