import { db } from "../prisma/db.js";
import { hashPassword } from "../utils/password.js";

type RegisterBusinessInput = {
  businessName: string;
  slug: string;
  userName: string;
  email: string;
  password: string;
};

export async function getUserByEmail(email: string) {
  const user = await db.orm.public.User
    .where({ email })
    .first();

  return user;
}

export async function registerBusiness(
  data: RegisterBusinessInput,
) {
  // Calculamos o hash antes de abrir a transação.
  const passwordHash = await hashPassword(data.password);

  return db.transaction(async (tx) => {
    const business = await tx.orm.public.Business.create({
      name: data.businessName,
      slug: data.slug,
    });

    const user = await tx.orm.public.User.create({
      name: data.userName,
      email: data.email,
      passwordHash,
      businessId: business.id,
    });

    // Retornamos apenas os dados que podem aparecer na resposta.
    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessId: user.businessId,
      },
    };
  });
}