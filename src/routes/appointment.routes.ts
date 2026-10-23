import { Router } from "express";
import {
  createAppointmentController,
  listAppointmentsController,
  getAppointmentByIdController,
  updateAppointmentStatusController,
} from "../controllers/appointment.controller.js";
import {
  requireAuth,
  requireBusinessAccess,
} from "../middlewares/auth.middleware.js";

export const appointmentRoutes = Router();

// O cliente pode solicitar um agendamento sem login.
appointmentRoutes.post("/:slug", createAppointmentController);

// Operações administrativas exigem acesso ao negócio.
appointmentRoutes.get(
  "/:slug",
  requireAuth,
  requireBusinessAccess,
  listAppointmentsController,
);

appointmentRoutes.get(
  "/:slug/:id",
  requireAuth,
  requireBusinessAccess,
  getAppointmentByIdController,
);

appointmentRoutes.patch(
  "/:slug/:id/status",
  requireAuth,
  requireBusinessAccess,
  updateAppointmentStatusController,
);