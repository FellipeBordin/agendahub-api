import { Router } from "express";
import {
  registerBusinessController,
  loginController,
} from "../controllers/auth.controller.js";
import {
  loginRateLimit,
  registerRateLimit,
} from "../middlewares/authRateLimit.middleware.js";

export const authRoutes = Router();

authRoutes.post("/register", registerRateLimit, registerBusinessController);
authRoutes.post("/login", loginRateLimit, loginController);
