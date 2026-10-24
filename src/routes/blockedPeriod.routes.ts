import { Router } from "express";
import {
  createBlockedPeriodController,
  listBlockedPeriodsController,
  deleteBlockedPeriodController,
} from "../controllers/blockedPeriod.controller.js";
import {
  requireAuth,
  requireBusinessAccess,
} from "../middlewares/auth.middleware.js";

export const blockedPeriodRoutes = Router();

blockedPeriodRoutes.post(
  "/:slug",
  requireAuth,
  requireBusinessAccess,
  createBlockedPeriodController,
);

blockedPeriodRoutes.get(
  "/:slug",
  requireAuth,
  requireBusinessAccess,
  listBlockedPeriodsController,
);

blockedPeriodRoutes.delete(
  "/:slug/:id",
  requireAuth,
  requireBusinessAccess,
  deleteBlockedPeriodController,
);
