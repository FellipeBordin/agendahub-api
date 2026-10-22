import { Router } from "express";
import { registerBusinessController } from "../controllers/auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/register", registerBusinessController);