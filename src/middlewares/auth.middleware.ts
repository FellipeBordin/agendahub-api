import type {
  NextFunction,
  Request,
  Response,
} from "express";
import jwt from "jsonwebtoken";
import { db } from "../prisma/db.js";
import { verifyAccessToken } from "../utils/token.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      error: "Informe um token de acesso.",
    });
  }

  try {
    const payload = verifyAccessToken(match[1]!);

    const user = await db.orm.public.User
      .where({ id: payload.userId })
      .first();

    if (
      !user ||
      !user.active ||
      user.businessId !== payload.businessId
    ) {
      return res.status(401).json({
        error: "Acesso não autorizado.",
      });
    }

    const business = await db.orm.public.Business
      .where({ id: user.businessId })
      .first();

    if (!business || !business.active) {
      return res.status(403).json({
        error: "O acesso a este negócio está indisponível.",
      });
    }

    res.locals.auth = {
      userId: user.id,
      businessId: business.id,
      businessSlug: business.slug,
    };

    return next();
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      (error instanceof Error && error.message === "Token inválido.")
    ) {
      return res.status(401).json({
        error: "Token inválido ou expirado.",
      });
    }

    return next(error);
  }
}

export function requireBusinessAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const auth = res.locals.auth;

  if (!auth) {
    return res.status(401).json({
      error: "Autenticação necessária.",
    });
  }

  if (req.params.slug !== auth.businessSlug) {
    return res.status(403).json({
      error: "Você não tem acesso a este negócio.",
    });
  }

  return next();
}