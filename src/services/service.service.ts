import { db } from "../prisma/db.js";
import { withScheduleLock } from "../utils/scheduleLock.js";

export async function getServices(businessId: number) {
  const services = await db.orm.public.Service.where({ businessId })
    .where({ active: true })
    .all();

  return services;
}

export async function getAllServices(businessId: number) {
  const services = await db.orm.public.Service.where({ businessId }).all();

  return services;
}

export async function createService(
  businessId: number,
  name: string,
  price: string,
  duration: number,
) {
  const service = await db.orm.public.Service.create({
    businessId,
    name,
    price,
    duration,
  });

  return service;
}

export async function getServiceById(businessId: number, id: number) {
  const service = await db.orm.public.Service.where({ businessId })
    .where({ id })
    .first();

  return service;
}

export async function updateService(
  businessId: number,
  id: number,
  name: string,
  price: string,
  duration: number,
) {
  return withScheduleLock(businessId, async (tx) => {
    const service = await tx.orm.public.Service.where({ businessId })
      .where({ id })
      .update({
        name,
        price,
        duration,
      });

    return service;
  });
}

export async function updateServiceStatus(
  businessId: number,
  id: number,
  active: boolean,
) {
  return withScheduleLock(businessId, async (tx) => {
    const service = await tx.orm.public.Service.where({ businessId })
      .where({ id })
      .update({ active });

    return service;
  });
}

export async function deleteService(businessId: number, id: number) {
  return withScheduleLock(businessId, async (tx) => {
    const service = await tx.orm.public.Service.where({ businessId })
      .where({ id })
      .first();

    if (!service) {
      return {
        error: "Serviço não encontrado.",
        statusCode: 404 as const,
      };
    }

    // Inclui agendamentos marcados, cancelados e concluídos.
    const appointment = await tx.orm.public.Appointment.where({ businessId })
      .where({ serviceId: id })
      .first();

    if (appointment) {
      return {
        error:
          "Este serviço possui agendamentos vinculados e não pode ser excluído. Você pode desativá-lo.",
        statusCode: 409 as const,
      };
    }

    await tx.orm.public.Service.where({ businessId }).where({ id }).delete();

    return {
      data: {
        id: service.id,
        message: "Serviço excluído com sucesso.",
      },
    };
  });
}
