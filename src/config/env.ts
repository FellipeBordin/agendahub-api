import "dotenv/config";

export function getDatabaseUrl(): string {
  const value = process.env["DATABASE_URL"];

  if (!value || value.trim() === "") {
    throw new Error("Configure DATABASE_URL nas variáveis de ambiente.");
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("DATABASE_URL deve ser uma URL PostgreSQL válida.");
  }

  if (
    !["postgresql:", "postgres:"].includes(parsed.protocol) ||
    !parsed.hostname ||
    parsed.pathname.length <= 1
  ) {
    throw new Error(
      "DATABASE_URL deve informar o servidor e o nome do banco PostgreSQL.",
    );
  }

  return value;
}

export function getJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];

  if (!secret || secret.trim().length < 64) {
    throw new Error(
      "Configure JWT_SECRET com uma chave de pelo menos 64 caracteres.",
    );
  }

  return secret;
}

export function getPort(): number {
  const value = process.env["PORT"] ?? "3000";

  if (!/^\d+$/.test(value)) {
    throw new Error("PORT deve ser um número inteiro entre 1 e 65535.");
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT deve ser um número inteiro entre 1 e 65535.");
  }

  return port;
}

export function validateEnvironment(): void {
  getDatabaseUrl();
  getJwtSecret();
  getPort();
}
