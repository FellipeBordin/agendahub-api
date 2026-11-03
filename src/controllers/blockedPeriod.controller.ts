import type { Request, Response } from "express";
import { validateBlockedPeriod } from "../validators/blockedPeriod.validator.js";
import { getBusinessBySlug } from "../services/business.service.js";
import { parseDateTime } from "../utils/parseDateTime.js";
import {
  scheduleBlockedPeriod,
  getBlockedPeriods,
  deleteBlockedPeriod,
} from "../services/blockedPeriod.service.js";

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

  const { startDate, endDate } = req.query;

  if (startDate === undefined && endDate === undefined) {
    const blockedPeriods = await getBlockedPeriods(business.id);

    return res.status(200).json(blockedPeriods);
  }

  if (typeof startDate !== "string" || typeof endDate !== "string") {
    return res.status(400).json({
      error: "Informe startDate e endDate no formato YYYY-MM-DD.",
    });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return res.status(400).json({
      error: "Informe startDate e endDate no formato YYYY-MM-DD.",
    });
  }

  const start = parseDateTime(`${startDate}T00:00:00-03:00`);
  const end = parseDateTime(`${endDate}T00:00:00-03:00`);

  if (!start || !end) {
    return res.status(400).json({
      error: "O período informado contém uma data inválida.",
    });
  }

  if (end.getTime() <= start.getTime()) {
    return res.status(400).json({
      error: "A data final deve ser posterior à data inicial.",
    });
  }

  const blockedPeriods = await getBlockedPeriods(business.id, {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  });

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
