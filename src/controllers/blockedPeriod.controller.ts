import type { Request, Response } from "express";
import { validateBlockedPeriod } from "../validators/blockedPeriod.validator.js";
import {
  scheduleBlockedPeriod,
  getBlockedPeriods,
  deleteBlockedPeriod,
} from "../services/blockedPeriod.service.js";
import { getBusinessBySlug } from "../services/business.service.js";

export async function createBlockedPeriodController(
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

  const { startAt, endAt, allDay, reason } = req.body ?? {};

  const validation = validateBlockedPeriod({
    startAt,
    endAt,
    allDay,
    reason,
  });

  if ("error" in validation) {
    return res.status(400).json({
      error: validation.error,
    });
  }

  const result = await scheduleBlockedPeriod(
    business.id,
    validation.data.startAt,
    validation.data.endAt,
    validation.data.allDay,
    validation.data.reason,
  );

  if ("error" in result) {
    return res.status(409).json({
      error: result.error,
      appointments: result.appointments,
    });
  }

  return res.status(201).json(result.data);
}

export async function listBlockedPeriodsController(
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

  const blockedPeriods = await getBlockedPeriods(business.id);

  return res.status(200).json(blockedPeriods);
}
export async function deleteBlockedPeriodController(
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
      error: "ID do bloqueio inválido.",
    });
  }

  const blockedPeriod = await deleteBlockedPeriod(business.id, id);

  if (!blockedPeriod) {
    return res.status(404).json({
      error: "Bloqueio não encontrado.",
    });
  }

  return res.status(200).json({
    message: "Bloqueio removido com sucesso.",
    blockedPeriod,
  });
}
