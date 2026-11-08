import type { Request, Response } from "express";
import { getBusinessBySlug } from "../services/business.service.js";
import {
  getNotifications,
  markNotificationAsRead,
} from "../services/notification.service.js";

export async function listNotificationsController(req: Request, res: Response) {
  const slug = req.params.slug;

  if (typeof slug !== "string" || slug.trim() === "") {
    return res.status(400).json({
      error: "O negócio não foi informado.",
    });
  }

  const business = await getBusinessBySlug(slug);

  if (!business || !business.active) {
    return res.status(404).json({
      error: "Negócio não encontrado.",
    });
  }

  const result = await getNotifications(business.id);

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json(result);
}

export async function markNotificationAsReadController(
  req: Request,
  res: Response,
) {
  const slug = req.params.slug;

  if (typeof slug !== "string" || slug.trim() === "") {
    return res.status(400).json({
      error: "O negócio não foi informado.",
    });
  }

  const business = await getBusinessBySlug(slug);

  if (!business || !business.active) {
    return res.status(404).json({
      error: "Negócio não encontrado.",
    });
  }

  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "ID da notificação inválido.",
    });
  }

  const notification = await markNotificationAsRead(business.id, id);

  if (!notification) {
    return res.status(404).json({
      error: "Notificação não encontrada.",
    });
  }

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json(notification);
}
