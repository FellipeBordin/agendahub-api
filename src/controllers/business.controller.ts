import type { Request, Response } from "express";
import { validateBusiness } from "../validators/business.validator.js";
import {
  createBusiness,
  getBusinessBySlug,
} from "../services/business.service.js";

export async function createBusinessController(req: Request, res: Response) {
  const { name, slug } = req.body;

  const validation = validateBusiness({
    name,
    slug,
  });

  if ("error" in validation) {
    return res.status(400).json({
      error: validation.error,
    });
  }

  const existingBusiness = await getBusinessBySlug(validation.data.slug);

  if (existingBusiness) {
    return res.status(409).json({
      error: "Já existe um negócio com este slug.",
    });
  }

  const business = await createBusiness(
    validation.data.name,
    validation.data.slug,
  );

  return res.status(201).json(business);
}
