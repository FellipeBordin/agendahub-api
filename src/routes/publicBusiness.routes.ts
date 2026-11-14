import { Router } from "express";
import { getPublicBusinessController } from "../controllers/publicBusiness.controller.js";

export const publicBusinessRoutes = Router();

// Consulta pública: não exige login.
publicBusinessRoutes.get("/:slug", getPublicBusinessController);
