import { Router } from "express";
import {
  getPushPublicKeyController,
  savePushSubscriptionController,
  removePushSubscriptionController,
} from "../controllers/pushSubscription.controller.js";
import {
  requireAuth,
  requireBusinessAccess,
} from "../middlewares/auth.middleware.js";

export const pushSubscriptionRoutes = Router();

pushSubscriptionRoutes.get(
  "/:slug/public-key",
  requireAuth,
  requireBusinessAccess,
  getPushPublicKeyController,
);

pushSubscriptionRoutes.post(
  "/:slug/subscriptions",
  requireAuth,
  requireBusinessAccess,
  savePushSubscriptionController,
);

pushSubscriptionRoutes.delete(
  "/:slug/subscriptions",
  requireAuth,
  requireBusinessAccess,
  removePushSubscriptionController,
);
