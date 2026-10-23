import { Router } from "express";
import {
  registerBusinessController,
  loginController,
} from "../controllers/auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/register", registerBusinessController);
authRoutes.post("/login", loginController);