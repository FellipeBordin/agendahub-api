import type { Request, Response } from "express";
import { getBusinessBySlug } from "../services/business.service.js";

export async function getPublicBusinessController(req: Request, res: Response) {
  const slug = req.params.slug;

  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return res.status(400).json({
      error: "O endereço do negócio é inválido.",
    });
  }

  const business = await getBusinessBySlug(slug);

  if (!business || !business.active) {
    return res.status(404).json({
      error: "Negócio não encontrado ou indisponível.",
    });
  }

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    name: business.name,
    slug: business.slug,
  });
}
