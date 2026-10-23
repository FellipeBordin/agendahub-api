import type { NextFunction, Request, Response } from "express";
import { validateRegisterBusiness, validateLogin } from "../validators/auth.validator.js";
import {
  getUserByEmail,
  registerBusiness,
  authenticateUser,
} from "../services/auth.service.js";
import { getBusinessBySlug } from "../services/business.service.js";
import { generateAccessToken } from "../utils/token.js";

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

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = req.body ?? {};

    const validation = validateLogin({
      email,
      password,
    });

    if ("error" in validation) {
      return res.status(400).json({
        error: validation.error,
      });
    }

    const result = await authenticateUser(
      validation.data.email,
      validation.data.password,
    );

    if ("error" in result) {
      return res.status(401).json({
        error: result.error,
      });
    }

    const accessToken = generateAccessToken({
      userId: result.data.user.id,
      businessId: result.data.user.businessId,
    });

    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json({
      accessToken,
      tokenType: "Bearer",
      expiresIn: 3600,
      user: result.data.user,
      business: result.data.business,
    });
  } catch (error) {
    next(error);
  }
}