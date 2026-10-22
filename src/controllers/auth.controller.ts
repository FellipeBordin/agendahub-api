import type { NextFunction, Request, Response } from "express";
import { validateRegisterBusiness } from "../validators/auth.validator.js";
import {
  getUserByEmail,
  registerBusiness,
} from "../services/auth.service.js";
import { getBusinessBySlug } from "../services/business.service.js";

export async function registerBusinessController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      businessName,
      slug,
      userName,
      email,
      password,
    } = req.body ?? {};

    const validation = validateRegisterBusiness({
      businessName,
      slug,
      userName,
      email,
      password,
    });

    if ("error" in validation) {
      return res.status(400).json({
        error: validation.error,
      });
    }

    const existingBusiness = await getBusinessBySlug(
      validation.data.slug,
    );

    if (existingBusiness) {
      return res.status(409).json({
        error: "Já existe um negócio com este slug.",
      });
    }

    const existingUser = await getUserByEmail(
      validation.data.email,
    );

    if (existingUser) {
      return res.status(409).json({
        error: "Já existe um usuário com este e-mail.",
      });
    }

    const result = await registerBusiness(validation.data);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}