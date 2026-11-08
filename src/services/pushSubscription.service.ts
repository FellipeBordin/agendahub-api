import { withScheduleLock } from "../utils/scheduleLock.js";

export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function savePushSubscription(
  businessId: number,
  userId: number,
  input: PushSubscriptionInput,
) {
  return withScheduleLock(businessId, async (tx) => {
    const existing = await tx.orm.public.PushSubscription.where({
      endpoint: input.endpoint,
    }).first();

    if (existing) {
      if (existing.userId !== userId || existing.businessId !== businessId) {
        return {
          error:
            "Este navegador já está vinculado a outra conta. Desative as notificações na conta anterior antes de ativar nesta.",
          statusCode: 409 as const,
        };
      }

      await tx.orm.public.PushSubscription.where({ id: existing.id })
        .where({ businessId })
        .where({ userId })
        .update({
          p256dh: input.p256dh,
          auth: input.auth,
        });

      return {
        data: {
          id: existing.id,
          message: "Notificações ativadas neste navegador.",
        },
      };
    }

    const subscription = await tx.orm.public.PushSubscription.create({
      businessId,
      userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    });

    return {
      data: {
        id: subscription.id,
        message: "Notificações ativadas neste navegador.",
      },
    };
  });
}

export async function removePushSubscription(
  businessId: number,
  userId: number,
  endpoint: string,
) {
  return withScheduleLock(businessId, async (tx) => {
    const subscription = await tx.orm.public.PushSubscription.where({
      businessId,
    })
      .where({ userId })
      .where({ endpoint })
      .first();

    if (!subscription) {
      return;
    }

    await tx.orm.public.PushSubscription.where({ id: subscription.id })
      .where({ businessId })
      .where({ userId })
      .delete();
  });
}
