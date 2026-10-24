import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(error);
  }

  // Erro gerado pelo express.json() ao receber JSON malformado.
  if (
    error instanceof SyntaxError &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    return res.status(400).json({
      error: "O corpo da requisição contém um JSON inválido.",
    });
  }

  // Registra apenas a categoria, sem body, token ou credenciais.
  console.error("Erro não tratado na API:", {
    name: error instanceof Error ? error.name : "UnknownError",
  });

  return res.status(500).json({
    error: "Ocorreu um erro interno. Tente novamente mais tarde.",
  });
}
