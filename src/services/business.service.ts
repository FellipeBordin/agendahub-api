import { db } from "../prisma/db.js";

export async function createBusiness(name: string, slug: string) {
  const business = await db.orm.public.Business.create({
    name,
    slug,
  });

  return business;
}

export async function getBusinessBySlug(slug: string) {
  const business = await db.orm.public.Business.where({ slug }).first();

  return business;
}
