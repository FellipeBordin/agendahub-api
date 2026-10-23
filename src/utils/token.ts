import "dotenv/config";
import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  userId: number;
  businessId: number;
};

function getJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];

  if (!secret || secret.length < 64) {
    throw new Error(
      "Configure JWT_SECRET no .env com a chave gerada.",
    );
  }

  return secret;
}

export function generateAccessToken(
  payload: AuthTokenPayload,
): string {
  return jwt.sign(
    {
      userId: payload.userId,
      businessId: payload.businessId,
    },
    getJwtSecret(),
    {
      algorithm: "HS256",
      expiresIn: "1h",
      issuer: "agendahub-api",
      audience: "agendahub-admin",
    },
  );
}

export function verifyAccessToken(
  token: string,
): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret(), {
    algorithms: ["HS256"],
    issuer: "agendahub-api",
    audience: "agendahub-admin",
  });

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "number" ||
    !Number.isSafeInteger(decoded.userId) ||
    decoded.userId <= 0 ||
    typeof decoded.businessId !== "number" ||
    !Number.isSafeInteger(decoded.businessId) ||
    decoded.businessId <= 0 ||
    typeof decoded.exp !== "number"
  ) {
    throw new Error("Token inválido.");
  }

  return {
    userId: decoded.userId,
    businessId: decoded.businessId,
  };
}