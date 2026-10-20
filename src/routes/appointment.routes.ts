import { Router } from "express";
import {
  createAppointmentController,
  listAppointmentsController,
  getAppointmentByIdController,
  updateAppointmentStatusController,
} from "../controllers/appointment.controller.js";

export const appointmentRoutes = Router();

appointmentRoutes.get("/:slug", listAppointmentsController);
appointmentRoutes.post("/:slug", createAppointmentController);
appointmentRoutes.get("/:slug/:id", getAppointmentByIdController);
appointmentRoutes.patch("/:slug/:id/status", updateAppointmentStatusController);
