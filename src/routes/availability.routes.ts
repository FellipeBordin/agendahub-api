import { Router } from "express";
import {
  createAvailabilityController,
  getAvailableSlotsController,
  updateAvailabilityController,
} from "../controllers/availability.controller.js";

export const availabilityRoutes = Router();

availabilityRoutes.get("/:slug/slots", getAvailableSlotsController);
availabilityRoutes.post("/:slug", createAvailabilityController);
availabilityRoutes.patch("/:slug", updateAvailabilityController);
