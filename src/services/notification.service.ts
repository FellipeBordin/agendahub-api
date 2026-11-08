import { db } from "../prisma/db.js";
import { withScheduleLock } from "../utils/scheduleLock.js";

export async function getNotifications(businessId: number) {
  const notifications = await db.orm.public.Notification.where({
    businessId,
  }).all();

  notifications.sort((a, b) => b.id - a.id);

  const unreadCount = notifications.filter(
    (notification) => notification.readAt === null,
  ).length;

  return {
    notifications,
    unreadCount,
  };
}
export async function markNotificationAsRead(businessId: number, id: number) {
  return withScheduleLock(businessId, async (tx) => {
    const notification = await tx.orm.public.Notification.where({ businessId })
      .where({ id })
      .first();

    if (!notification) {
      return null;
    }

    // Uma segunda chamada mantém a data da primeira leitura.
    if (notification.readAt !== null) {
      return notification;
    }

    return tx.orm.public.Notification.where({ businessId })
      .where({ id })
      .update({
        readAt: new Date().toISOString(),
      });
  });
}
