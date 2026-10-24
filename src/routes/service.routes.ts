import { Router } from "express";
import {
  listServices,
  createServiceController,
  getServiceByIdController,
  updateServiceController,
  updateServiceStatusController,
} from "../controllers/service.controller.js";
import {
  requireAuth,
  requireBusinessAccess,
} from "../middlewares/auth.middleware.js";

const serviceRoutes = Router();

// Consultas públicas para o cliente escolher o serviço.
serviceRoutes.get("/:slug", listServices);
serviceRoutes.get("/:slug/:id", getServiceByIdController);

// Operações administrativas.
serviceRoutes.post(
  "/:slug",
  requireAuth,
  requireBusinessAccess,
  createServiceController,
);

serviceRoutes.put(
  "/:slug/:id",
  requireAuth,
  requireBusinessAccess,
  updateServiceController,
);

serviceRoutes.patch(
  "/:slug/:id/status",
  requireAuth,
  requireBusinessAccess,
  updateServiceStatusController,
);

export { serviceRoutes };
