import { Router } from "express";
import { createBusinessController } from "../controllers/business.controller.js";

export const businessRoutes = Router();

businessRoutes.post("/", createBusinessController);
