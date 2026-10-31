import { Router } from "express";
import {
  listServices,
  listAllServicesController,
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

// Lista pública: somente serviços ativos.
serviceRoutes.get("/:slug", listServices);

// Deve vir antes de "/:slug/:id".
serviceRoutes.get(
  "/:slug/admin",
  requireAuth,
  requireBusinessAccess,
  listAllServicesController,
);

serviceRoutes.get("/:slug/:id", getServiceByIdController);

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
