import { db } from "../prisma/db.js";
import { getWebPush } from "../config/webPush.js";
import { isAllowedPushEndpoint } from "../utils/pushEndpoint.js";

function getStatusCode(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return undefined;
}

export async function sendNewAppointmentPush(
  businessId: number,
  appointmentId: number,
): Promise<void> {
  const business = await db.orm.public.Business.where({
    id: businessId,
  }).first();

  if (!business || !business.active) return;

  const notification = await db.orm.public.Notification.where({ businessId })
    .where({ appointmentId })
    .first();

  if (!notification) return;

  const subscriptions = await db.orm.public.PushSubscription.where({
    businessId,
  }).all();

  if (subscriptions.length === 0) return;

  const webPush = getWebPush();

  // Não envia nome ou telefone do cliente para a tela de bloqueio.
  const payload = JSON.stringify({
    notificationId: notification.id,
  });

  // Envia para até cinco inscrições por vez.
  for (let index = 0; index < subscriptions.length; index += 5) {
    const batch = subscriptions.slice(index, index + 5);

    const results = await Promise.allSettled(
      batch.map(async (subscription) => {
        if (!isAllowedPushEndpoint(subscription.endpoint)) {
          console.warn("Web Push: destino não permitido.", {
            subscriptionId: subscription.id,
          });

          return;
        }

        // Confere se o administrador ainda está ativo e no mesmo negócio.
        const user = await db.orm.public.User.where({ id: subscription.userId })
          .where({ businessId })
          .first();

        if (!user || !user.active) return;

        try {
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload,
            {
              TTL: 3600,
              urgency: "high",
              timeout: 10_000,
            },
          );
        } catch (error) {
          const statusCode = getStatusCode(error);

          if (statusCode === 404 || statusCode === 410) {
            // Remove apenas a inscrição que foi usada neste envio.
            // As chaves evitam excluir um cadastro atualizado nesse intervalo.
            await db.orm.public.PushSubscription.where({ id: subscription.id })
              .where({ businessId })
              .where({ userId: subscription.userId })
              .where({ endpoint: subscription.endpoint })
              .where({ p256dh: subscription.p256dh })
              .where({ auth: subscription.auth })
              .delete();

            return;
          }

          // Não registra endpoint, chaves ou dados do cliente.
          console.error("Web Push: falha no envio.", {
            subscriptionId: subscription.id,
            statusCode,
            name: error instanceof Error ? error.name : "UnknownError",
          });
        }
      }),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Web Push: falha ao processar inscrição.", {
          name:
            result.reason instanceof Error
              ? result.reason.name
              : "UnknownError",
        });
      }
    }
  }
}
