import { Router } from "express";
import {
  createAvailabilityController,
  getAvailableSlotsController,
  updateAvailabilityController,
  listAvailabilitiesController,
} from "../controllers/availability.controller.js";
import {
  requireAuth,
  requireBusinessAccess,
} from "../middlewares/auth.middleware.js";

export const availabilityRoutes = Router();

// Consulta pública dos horários livres.
availabilityRoutes.get("/:slug/slots", getAvailableSlotsController);

// Consulta administrativa do funcionamento semanal.
availabilityRoutes.get(
  "/:slug",
  requireAuth,
  requireBusinessAccess,
  listAvailabilitiesController,
);

// Configuração administrativa do funcionamento.
availabilityRoutes.post(
  "/:slug",
  requireAuth,
  requireBusinessAccess,
  createAvailabilityController,
);

availabilityRoutes.patch(
  "/:slug",
  requireAuth,
  requireBusinessAccess,
  updateAvailabilityController,
);
