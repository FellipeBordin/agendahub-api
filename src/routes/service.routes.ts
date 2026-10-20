import { Router } from "express";
import {
  listServices,
  createServiceController,
  getServiceByIdController,
  updateServiceController,
  updateServiceStatusController,
} from "../controllers/service.controller.js";

const serviceRoutes = Router();

serviceRoutes.get("/:slug", listServices);
serviceRoutes.post("/:slug", createServiceController);

serviceRoutes.get("/:slug/:id", getServiceByIdController);
serviceRoutes.put("/:slug/:id", updateServiceController);
serviceRoutes.patch("/:slug/:id/status", updateServiceStatusController);

export { serviceRoutes };
