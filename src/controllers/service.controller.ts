import { Request, Response } from "express";
import {
  getServices,
  createService,
  getServiceById,
  updateService,
  updateServiceStatus,
} from "../services/service.service.js";
import { validateService } from "../validators/service.validator.js";
import { getBusinessBySlug } from "../services/business.service.js";

export async function listServices(req: Request, res: Response) {
  const slug = req.params.slug;

  if (typeof slug !== "string" || slug.trim() === "") {
    return res.status(400).json({
      error: "O negócio não foi informado.",
    });
  }

  const business = await getBusinessBySlug(slug);

  if (!business || !business.active) {
    return res.status(404).json({
      error: "Negócio não encontrado.",
    });
  }

  const services = await getServices(business.id);

  return res.json(services);
}

export async function createServiceController(req: Request, res: Response) {
  const slug = req.params.slug;

  if (typeof slug !== "string" || slug.trim() === "") {
    return res.status(400).json({
      error: "O negócio não foi informado.",
    });
  }

  const business = await getBusinessBySlug(slug);

  if (!business || !business.active) {
    return res.status(404).json({
      error: "Negócio não encontrado.",
    });
  }

  const { name, price, duration } = req.body;

  const validation = validateService({
    name,
    price,
    duration,
  });

  if ("error" in validation) {
    return res.status(400).json({
      error: validation.error,
    });
  }

  const service = await createService(
    business.id,
    validation.data.name,
    validation.data.price,
    validation.data.duration,
  );

  return res.status(201).json(service);
}

export async function getServiceByIdController(req: Request, res: Response) {
  const slug = req.params.slug;

  if (typeof slug !== "string" || slug.trim() === "") {
    return res.status(400).json({
      error: "O negócio não foi informado.",
    });
  }

  const business = await getBusinessBySlug(slug);

  if (!business || !business.active) {
    return res.status(404).json({
      error: "Negócio não encontrado.",
    });
  }

  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "ID do serviço inválido.",
    });
  }

  const service = await getServiceById(business.id, id);

  if (!service) {
    return res.status(404).json({
      error: "Serviço não encontrado.",
    });
  }

  return res.json(service);
}

export async function updateServiceController(req: Request, res: Response) {
  const slug = req.params.slug;

  if (typeof slug !== "string" || slug.trim() === "") {
    return res.status(400).json({
      error: "O negócio não foi informado.",
    });
  }

  const business = await getBusinessBySlug(slug);

  if (!business || !business.active) {
    return res.status(404).json({
      error: "Negócio não encontrado.",
    });
  }

  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "ID do serviço inválido.",
    });
  }

  const { name, price, duration } = req.body;

  const validation = validateService({
    name,
    price,
    duration,
  });

  if ("error" in validation) {
    return res.status(400).json({
      error: validation.error,
    });
  }

  const service = await updateService(
    business.id,
    id,
    validation.data.name,
    validation.data.price,
    validation.data.duration,
  );

  if (!service) {
    return res.status(404).json({
      error: "Serviço não encontrado.",
    });
  }

  return res.json(service);
}

export async function updateServiceStatusController(
  req: Request,
  res: Response,
) {
  const slug = req.params.slug;

  if (typeof slug !== "string" || slug.trim() === "") {
    return res.status(400).json({
      error: "O negócio não foi informado.",
    });
  }

  const business = await getBusinessBySlug(slug);

  if (!business || !business.active) {
    return res.status(404).json({
      error: "Negócio não encontrado.",
    });
  }

  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "ID do serviço inválido.",
    });
  }

  const { active } = req.body;

  if (typeof active !== "boolean") {
    return res.status(400).json({
      error: "O status active deve ser true ou false.",
    });
  }

  const service = await updateServiceStatus(business.id, id, active);

  if (!service) {
    return res.status(404).json({
      error: "Serviço não encontrado.",
    });
  }

  return res.json(service);
}
