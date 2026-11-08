import { Router } from "express";
import {
  listNotificationsController,
  markNotificationAsReadController,
} from "../controllers/notification.controller.js";
import {
  requireAuth,
  requireBusinessAccess,
} from "../middlewares/auth.middleware.js";

export const notificationRoutes = Router();

notificationRoutes.get(
  "/:slug",
  requireAuth,
  requireBusinessAccess,
  listNotificationsController,
);

notificationRoutes.patch(
  "/:slug/:id/read",
  requireAuth,
  requireBusinessAccess,
  markNotificationAsReadController,
);
