import type { Request, Response } from "express";
import { validateAppointment } from "../validators/appointment.validator.js";
import {
  getAppointments,
  scheduleAppointment,
  getAppointmentById,
  updateAppointmentStatus,
} from "../services/appointment.service.js";
import { getBusinessBySlug } from "../services/business.service.js";
export async function createAppointmentController(req: Request, res: Response) {
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

  const { clientName, clientPhone, startAt, serviceId } = req.body;

  const validation = validateAppointment({
    clientName,
    clientPhone,
    startAt,
    serviceId,
  });

  if ("error" in validation) {
    return res.status(400).json({
      error: validation.error,
    });
  }

  const result = await scheduleAppointment(
    business.id,
    validation.data.clientName,
    validation.data.clientPhone,
    validation.data.startAt,
    validation.data.serviceId,
  );

  if ("error" in result) {
    return res.status(400).json({
      error: result.error,
    });
  }

  return res.status(201).json(result.data);
}
export async function listAppointmentsController(req: Request, res: Response) {
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

  const appointments = await getAppointments(business.id);

  return res.status(200).json(appointments);
}
export async function getAppointmentByIdController(
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

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "ID do agendamento inválido.",
    });
  }

  const appointment = await getAppointmentById(business.id, id);

  if (!appointment) {
    return res.status(404).json({
      error: "Agendamento não encontrado.",
    });
  }

  return res.status(200).json(appointment);
}

export async function updateAppointmentStatusController(
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
  const { status } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "ID do agendamento inválido.",
    });
  }

  const allowedStatuses = ["SCHEDULED", "COMPLETED", "CANCELED"] as const;

  if (
    typeof status !== "string" ||
    !allowedStatuses.includes(status as (typeof allowedStatuses)[number])
  ) {
    return res.status(400).json({
      error: "Status do agendamento inválido.",
    });
  }

  const existingAppointment = await getAppointmentById(business.id, id);

  if (!existingAppointment) {
    return res.status(404).json({
      error: "Agendamento não encontrado.",
    });
  }

  const appointment = await updateAppointmentStatus(
    business.id,
    id,
    status as (typeof allowedStatuses)[number],
  );

  return res.status(200).json(appointment);
}
