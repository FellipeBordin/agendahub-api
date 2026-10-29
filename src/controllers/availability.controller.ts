import type { Request, Response } from "express";
import { validateAvailability } from "../validators/availability.validator.js";
import {
  createAvailability,
  updateAvailability,
} from "../services/availability.service.js";
import { getAvailableSlots } from "../services/slot.service.js";
import { getBusinessBySlug } from "../services/business.service.js";

export async function createAvailabilityController(
  req: Request,
  res: Response,
) {
  const slug = req.params.slug;

  if (typeof slug !== "string" || slug.trim() === "") {
    return res.status(400).json({ error: "O negócio não foi informado." });
  }

  const business = await getBusinessBySlug(slug);
  if (!business || !business.active) {
    return res.status(404).json({ error: "Negócio não encontrado." });
  }

  const { dayOfWeek, startTime, endTime } = req.body ?? {};
  const validation = validateAvailability({ dayOfWeek, startTime, endTime });

  if ("error" in validation) {
    return res.status(400).json({ error: validation.error });
  }

  const result = await createAvailability(
    business.id,
    validation.data.dayOfWeek,
    validation.data.startTime,
    validation.data.endTime,
  );

  if (typeof result.statusCode === "number") {
    return res.status(result.statusCode).json({ error: result.error });
  }

  return res.status(201).json(result.data);
}

export async function getAvailableSlotsController(req: Request, res: Response) {
  const slug = req.params.slug;

  if (typeof slug !== "string" || slug.trim() === "") {
    return res.status(400).json({ error: "O negócio não foi informado." });
  }

  const business = await getBusinessBySlug(slug);
  if (!business || !business.active) {
    return res.status(404).json({ error: "Negócio não encontrado." });
  }

  const { date, serviceId } = req.query;

  if (typeof date !== "string" || date.trim() === "") {
    return res.status(400).json({ error: "A data é obrigatória." });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({
      error: "A data deve estar no formato YYYY-MM-DD.",
    });
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  const isValidDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day;

  if (!isValidDate) {
    return res.status(400).json({ error: "A data informada é inválida." });
  }

  const todayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const yearToday = todayParts.find((part) => part.type === "year")!.value;
  const monthToday = todayParts.find((part) => part.type === "month")!.value;
  const dayToday = todayParts.find((part) => part.type === "day")!.value;
  const todayString = `${yearToday}-${monthToday}-${dayToday}`;

  if (date < todayString) {
    return res.status(400).json({
      error: "Não é possível consultar horários de uma data passada.",
    });
  }

  if (typeof serviceId !== "string" || serviceId.trim() === "") {
    return res.status(400).json({ error: "O serviço informado é inválido." });
  }

  const numericServiceId = Number(serviceId);
  if (!Number.isInteger(numericServiceId) || numericServiceId <= 0) {
    return res.status(400).json({ error: "O serviço informado é inválido." });
  }

  const result = await getAvailableSlots(business.id, date, numericServiceId);
  if ("error" in result) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json(result);
}

export async function updateAvailabilityController(
  req: Request,
  res: Response,
) {
  const slug = req.params.slug;

  if (typeof slug !== "string" || slug.trim() === "") {
    return res.status(400).json({ error: "O negócio não foi informado." });
  }

  const business = await getBusinessBySlug(slug);
  if (!business || !business.active) {
    return res.status(404).json({ error: "Negócio não encontrado." });
  }

  const { dayOfWeek, startTime, endTime } = req.body ?? {};
  const validation = validateAvailability({ dayOfWeek, startTime, endTime });

  if ("error" in validation) {
    return res.status(400).json({ error: validation.error });
  }

  const result = await updateAvailability(
    business.id,
    validation.data.dayOfWeek,
    validation.data.startTime,
    validation.data.endTime,
  );

  if (typeof result.statusCode === "number") {
    return res.status(result.statusCode).json({
      error: result.error,
      appointments: "appointments" in result ? result.appointments : undefined,
    });
  }

  return res.status(200).json({
    data: result.data,
    previous: result.previous,
  });
}
