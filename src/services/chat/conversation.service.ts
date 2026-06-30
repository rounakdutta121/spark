import type { MessageType } from "@prisma/client";
import { PAGINATION } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  assertConversationAccess,
  getOtherUserIdFromParticipants,
} from "@/services/chat/access.service";
import { getBlockedUserIds } from "@/services/moderation/block.service";
import { isRecentlyActive } from "@/services/chat/poll.service";
import type {
  ConversationDetail,
  ConversationListItem,
  CursorPage,
  MessagePreview,
} from "@/types/chat";

function primaryPhotoUrl(
  photos: { url: string; isPrimary: boolean; order: number }[],
): string | null {
  const primary = photos.find((p) => p.isPrimary) ?? photos[0];
  return primary?.url ?? null;
}

function buildPreview(
  message: {
    id: string;
    type: MessageType;
    text: string | null;
    senderId: string;
    isDeleted: boolean;
    createdAt: Date;
  } | null,
): MessagePreview | null {
  if (!message) return null;
  return {
    id: message.id,
    type: message.type,
    text: message.isDeleted ? null : message.text,
    senderId: message.senderId,
    isDeleted: message.isDeleted,
    createdAt: message.createdAt.toISOString(),
  };
}

function previewText(message: MessagePreview | null, viewerId: string): string {
  if (!message) return "Start the conversation";
  if (message.isDeleted) return "Message deleted";
  if (message.type === "IMAGE") return "Photo";
  if (message.type === "AUDIO") return "Voice message";
  if (message.type === "GIF") return "GIF";
  if (message.type === "SYSTEM") return message.text ?? "System message";
  const prefix = message.senderId === viewerId ? "You: " : "";
  return `${prefix}${message.text ?? ""}`;
}

export async function listConversations(
  userId: string,
  options: { cursor?: string; limit?: number; search?: string },
): Promise<CursorPage<ConversationListItem>> {
  const limit = Math.min(options.limit ?? PAGINATION.defaultLimit, 50);
  const search = options.search?.trim().toLowerCase();

  const participants = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { select: { userId: true } },
          messages: {
            where: { hides: { none: { userId } } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { conversation: { lastMessageAt: "desc" } },
    take: limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const otherIds = participants.map((p) =>
    getOtherUserIdFromParticipants(p.conversation.participants, userId),
  );

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: otherIds } },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      user: { select: { id: true, name: true, lastActiveAt: true } },
    },
  });

  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  let items = participants.map((participant) => {
    const otherId = getOtherUserIdFromParticipants(
      participant.conversation.participants,
      userId,
    );
    const profile = profileMap.get(otherId);
    const lastMsg = participant.conversation.messages[0] ?? null;

    const unreadCount =
      lastMsg &&
      lastMsg.senderId !== userId &&
      (participant.lastReadAt == null ||
        lastMsg.createdAt > participant.lastReadAt)
        ? 1
        : 0;

    return {
      id: participant.conversation.id,
      otherUser: {
        id: otherId,
        name: profile?.user.name ?? "User",
        photoUrl: profile ? primaryPhotoUrl(profile.photos) : null,
        isOnline: profile?.user.lastActiveAt
          ? isRecentlyActive(profile.user.lastActiveAt)
          : false,
      },
      lastMessage: buildPreview(lastMsg),
      lastMessageAt: participant.conversation.lastMessageAt.toISOString(),
      unreadCount,
      _searchName: profile?.user.name.toLowerCase() ?? "",
      _preview: previewText(buildPreview(lastMsg), userId),
    };
  });

  if (search) {
    items = items.filter(
      (item) =>
        item._searchName.includes(search) ||
        item._preview.toLowerCase().includes(search),
    );
  }

  const blockedIds = await getBlockedUserIds(userId);
  items = items.filter((item) => !blockedIds.has(item.otherUser.id));

  const hasMore = items.length > limit;
  const page = items.slice(0, limit).map(
    ({ id, otherUser, lastMessage, lastMessageAt, unreadCount }) => ({
      id,
      otherUser,
      lastMessage,
      lastMessageAt,
      unreadCount,
    }),
  );

  return {
    items: page,
    nextCursor: hasMore ? participants[limit]?.id ?? null : null,
    hasMore,
  };
}

export async function getConversation(
  userId: string,
  conversationId: string,
): Promise<ConversationDetail> {
  const conversation = await assertConversationAccess(userId, conversationId);
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  const otherId = getOtherUserIdFromParticipants(participants, userId);

  const [profile, lastMsg, participant] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: otherId },
      include: {
        photos: { orderBy: { order: "asc" }, take: 1 },
        user: { select: { id: true, name: true, lastActiveAt: true } },
      },
    }),
    prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    }),
  ]);

  const preview = buildPreview(lastMsg);
  const unreadCount =
    lastMsg &&
    lastMsg.senderId !== userId &&
    (participant?.lastReadAt == null ||
      lastMsg.createdAt > participant.lastReadAt)
      ? 1
      : 0;

  return {
    id: conversation.id,
    otherUser: {
      id: otherId,
      name: profile?.user.name ?? "User",
      photoUrl: profile ? primaryPhotoUrl(profile.photos) : null,
      isOnline: profile?.user.lastActiveAt
        ? isRecentlyActive(profile.user.lastActiveAt)
        : false,
    },
    lastMessage: preview,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    unreadCount,
  };
}

export async function markConversationRead(
  userId: string,
  conversationId: string,
): Promise<void> {
  await assertConversationAccess(userId, conversationId);
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
}
