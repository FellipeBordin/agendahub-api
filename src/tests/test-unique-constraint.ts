import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../prisma/db.js";
import { isUniqueConstraintError } from "../utils/databaseErrors.js";

async function main() {
  const slug = `teste-transacao-${randomUUID()}`;
  let duplicateDetected = false;

  try {
    await db.transaction(async (tx) => {
      // Este registro deve ser desfeito quando a segunda criação falhar.
      await tx.orm.public.Business.create({
        name: "Teste temporário de transação",
        slug,
      });

      // Força uma violação de unicidade usando o mesmo slug.
      await tx.orm.public.Business.create({
        name: "Teste duplicado",
        slug,
      });

      // Impede o commit se a restrição não funcionar como esperado.
      throw new Error("A restrição de slug único não foi aplicada.");
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    duplicateDetected = true;
  }

  assert.equal(
    duplicateDetected,
    true,
    "A duplicidade deveria ter sido identificada.",
  );

  const remainingBusiness = await db.orm.public.Business.where({
    slug,
  }).first();

  assert.ok(
    !remainingBusiness,
    "A transação deveria ter desfeito o primeiro cadastro.",
  );

  console.log("OK: erro de duplicidade identificado.");
  console.log("OK: transação revertida, sem cadastro de teste salvo.");
}

main()
  .catch((error: unknown) => {
    console.error(
      "Teste falhou:",
      error instanceof Error ? error.message : "Erro desconhecido.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
