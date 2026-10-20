import { Router } from "express";
import {
  createBlockedPeriodController,
  listBlockedPeriodsController,
  deleteBlockedPeriodController,
} from "../controllers/blockedPeriod.controller.js";

export const blockedPeriodRoutes = Router();

blockedPeriodRoutes.post("/:slug", createBlockedPeriodController);
blockedPeriodRoutes.get("/:slug", listBlockedPeriodsController);
blockedPeriodRoutes.delete("/:slug/:id", deleteBlockedPeriodController);
