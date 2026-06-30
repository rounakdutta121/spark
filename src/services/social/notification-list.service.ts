import { prisma } from "@/lib/prisma";
import { buildNotificationSummary } from "@/lib/social/notification-display";
import { mapUserPreview, userPreviewSelect } from "@/services/social/social.mapper";
import type { NotificationView } from "@/types/social";

function actorIdFromData(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  return typeof record.userId === "string" ? record.userId : null;
}

export async function listNotifications(
  userId: string,
  cursor?: string,
  limit = 30,
): Promise<{
  notifications: NotificationView[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
}> {
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const last = slice[slice.length - 1];

  const actorIds = [
    ...new Set(
      slice
        .map((n) => actorIdFromData(n.data))
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds }, isActive: true },
        select: userPreviewSelect,
      })
    : [];
  const actorMap = new Map(actors.map((u) => [u.id, mapUserPreview(u)]));

  return {
    notifications: slice.map((n) => {
      const data = (n.data as Record<string, unknown> | null) ?? null;
      const actorId = actorIdFromData(data);
      const actor = actorId ? actorMap.get(actorId) ?? null : null;

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        summary: buildNotificationSummary(n.type, actor, n.body),
        data,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
        actor,
      };
    }),
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
    hasMore,
    unreadCount,
  };
}

export async function deleteNotifications(
  userId: string,
  ids?: string[],
): Promise<void> {
  await prisma.notification.deleteMany({
    where: ids?.length
      ? { userId, id: { in: ids } }
      : { userId },
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}
