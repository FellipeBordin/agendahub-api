import { Buffer } from "node:buffer";
import type { Request, Response } from "express";
import { getWebPush } from "../config/webPush.js";
import { isUniqueConstraintError } from "../utils/databaseErrors.js";
import { isAllowedPushEndpoint } from "../utils/pushEndpoint.js";
import {
  savePushSubscription,
  removePushSubscription,
} from "../services/pushSubscription.service.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidKey(value: unknown, expectedBytes: number): value is string {
  if (
    typeof value !== "string" ||
    value.length > 128 ||
    !/^[A-Za-z0-9_-]+={0,2}$/.test(value)
  ) {
    return false;
  }

  return Buffer.from(value, "base64url").length === expectedBytes;
}

export function getPushPublicKeyController(_req: Request, res: Response) {
  const auth = res.locals.auth;

  if (!auth) {
    return res.status(401).json({
      error: "Autenticação necessária.",
    });
  }

  // Confirma que as configurações VAPID estão válidas.
  getWebPush();

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    publicKey: process.env["VAPID_PUBLIC_KEY"]!.trim(),
  });
}

export async function savePushSubscriptionController(
  req: Request,
  res: Response,
) {
  const auth = res.locals.auth;

  if (!auth) {
    return res.status(401).json({
      error: "Autenticação necessária.",
    });
  }

  const body: unknown = req.body;

  if (
    !isRecord(body) ||
    typeof body.endpoint !== "string" ||
    body.endpoint.length > 2048 ||
    !isRecord(body.keys)
  ) {
    return res.status(400).json({
      error: "Inscrição de notificações inválida.",
    });
  }

  let endpoint: URL;

  try {
    endpoint = new URL(body.endpoint);
  } catch {
    return res.status(400).json({
      error: "Endereço de notificações inválido.",
    });
  }

  if (
    endpoint.protocol !== "https:" ||
    endpoint.username !== "" ||
    endpoint.password !== "" ||
    endpoint.hash !== ""
  ) {
    return res.status(400).json({
      error:
        "O endereço de notificações deve usar HTTPS e não conter credenciais ou fragmentos.",
    });
  }

  if (!isAllowedPushEndpoint(endpoint.href)) {
    return res.status(400).json({
      error: "O provedor de notificações deste navegador não é suportado.",
    });
  }

  const { p256dh, auth: authKey } = body.keys;

  if (
    !isValidKey(p256dh, 65) ||
    !isValidKey(authKey, 16) ||
    Buffer.from(p256dh, "base64url")[0] !== 4
  ) {
    return res.status(400).json({
      error: "As chaves da inscrição são inválidas.",
    });
  }

  try {
    const result = await savePushSubscription(auth.businessId, auth.userId, {
      endpoint: endpoint.href,
      p256dh,
      auth: authKey,
    });

    if (typeof result.statusCode === "number") {
      return res.status(result.statusCode).json({
        error: result.error,
      });
    }

    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json(result.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({
        error:
          "Esta inscrição já foi cadastrada. Atualize a página e tente novamente.",
      });
    }

    throw error;
  }
}

export async function removePushSubscriptionController(
  req: Request,
  res: Response,
) {
  const auth = res.locals.auth;

  if (!auth) {
    return res.status(401).json({
      error: "Autenticação necessária.",
    });
  }

  const body: unknown = req.body;

  if (
    !isRecord(body) ||
    typeof body.endpoint !== "string" ||
    body.endpoint.trim() === "" ||
    body.endpoint.length > 2048
  ) {
    return res.status(400).json({
      error: "Informe o endereço da inscrição.",
    });
  }

  let endpoint: URL;

  try {
    endpoint = new URL(body.endpoint);
  } catch {
    return res.status(400).json({
      error: "Endereço de notificações inválido.",
    });
  }

  if (
    endpoint.protocol !== "https:" ||
    endpoint.username !== "" ||
    endpoint.password !== "" ||
    endpoint.hash !== ""
  ) {
    return res.status(400).json({
      error: "Endereço de notificações inválido.",
    });
  }

  await removePushSubscription(auth.businessId, auth.userId, endpoint.href);

  res.setHeader("Cache-Control", "no-store");

  return res.status(204).send();
}
