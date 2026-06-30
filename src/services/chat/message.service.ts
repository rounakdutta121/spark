import type { MessageType } from "@prisma/client";
import { CHAT, PAGINATION } from "@/lib/constants";
import { sanitizeMessageText, isValidEmoji } from "@/lib/chat/sanitize";
import { assertAllowedChatMediaUrl } from "@/lib/chat/media-url";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  assertConversationAccess,
  ChatAccessError,
} from "@/services/chat/access.service";
import { getOtherUserIdForConversation } from "@/services/chat/conversation-create.service";
import { markConversationRead } from "@/services/chat/conversation.service";
import { createNotification } from "@/services/chat/notification.service";
import { mapMessage, messageInclude } from "@/services/chat/message.mapper";
import type { CursorPage, MessageView } from "@/types/chat";

export class MessageServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = "MessageServiceError";
  }
}

interface SendMessageInput {
  conversationId: string;
  type: MessageType;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  replyToId?: string;
}

export async function listMessages(
  userId: string,
  conversationId: string,
  options: { cursor?: string; limit?: number },
): Promise<CursorPage<MessageView>> {
  await assertConversationAccess(userId, conversationId);

  const limit = Math.min(options.limit ?? PAGINATION.defaultLimit, 50);

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      NOT: { hides: { some: { userId } } },
    },
    include: messageInclude,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(options.cursor
      ? { cursor: { id: options.cursor }, skip: 1 }
      : {}),
  });

  const hasMore = messages.length > limit;
  const page = messages.slice(0, limit).reverse();

  return {
    items: page.map((m) => mapMessage(m, userId)),
    nextCursor: hasMore ? messages[limit]?.id ?? null : null,
    hasMore,
  };
}

export async function sendMessage(
  userId: string,
  input: SendMessageInput,
): Promise<MessageView> {
  const rate = await checkRateLimit(
    `msg:${userId}`,
    CHAT.messageRateLimit.maxAttempts,
    CHAT.messageRateLimit.windowMs,
  );
  if (!rate.allowed) {
    throw new MessageServiceError("Too many messages", 429, "RATE_LIMITED");
  }

  await assertConversationAccess(userId, input.conversationId);

  assertAllowedChatMediaUrl(input.imageUrl, "image");
  assertAllowedChatMediaUrl(input.audioUrl, "audio");

  if (input.replyToId) {
    const reply = await prisma.message.findFirst({
      where: { id: input.replyToId, conversationId: input.conversationId },
    });
    if (!reply) {
      throw new MessageServiceError("Reply target not found", 400, "INVALID_REPLY");
    }
  }

  let text = input.text;
  if (input.type === "TEXT" || input.type === "GIF") {
    if (!text?.trim()) {
      throw new MessageServiceError("Message text required", 400, "VALIDATION");
    }
    text = sanitizeMessageText(text);
  }

  const message = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      senderId: userId,
      type: input.type,
      text: text ?? null,
      imageUrl: input.imageUrl ?? null,
      audioUrl: input.audioUrl ?? null,
      replyToId: input.replyToId ?? null,
    },
    include: messageInclude,
  });

  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: { lastMessageAt: message.createdAt },
  });

  const view = mapMessage(message, userId);
  const otherUserId = await getOtherUserIdForConversation(
    input.conversationId,
    userId,
  );

  if (otherUserId) {
    await createNotification({
      userId: otherUserId,
      type: "MESSAGE",
      title: "New message",
      body: text?.slice(0, 120) ?? "Sent you a message",
      data: { conversationId: input.conversationId, messageId: message.id, userId },
    });
  }

  return view;
}

export async function editMessage(
  userId: string,
  messageId: string,
  text: string,
): Promise<MessageView> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message) {
    throw new MessageServiceError("Message not found", 404, "NOT_FOUND");
  }

  if (message.senderId !== userId) {
    throw new ChatAccessError("Forbidden", 403, "FORBIDDEN");
  }

  if (message.isDeleted) {
    throw new MessageServiceError("Message deleted", 400, "DELETED");
  }

  if (message.type !== "TEXT") {
    throw new MessageServiceError("Only text messages can be edited", 400);
  }

  const age = Date.now() - message.createdAt.getTime();
  if (age > CHAT.editWindowMs) {
    throw new MessageServiceError("Edit window expired", 400, "EDIT_EXPIRED");
  }

  const sanitized = sanitizeMessageText(text);
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { text: sanitized, isEdited: true },
    include: messageInclude,
  });

  return mapMessage(updated, userId);
}

export async function deleteMessage(
  userId: string,
  messageId: string,
  scope: "self" | "everyone",
): Promise<void> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message) {
    throw new MessageServiceError("Message not found", 404, "NOT_FOUND");
  }

  await assertConversationAccess(userId, message.conversationId);

  if (scope === "self") {
    await prisma.messageHide.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId },
      update: {},
    });
    return;
  }

  if (message.senderId !== userId) {
    throw new ChatAccessError("Forbidden", 403, "FORBIDDEN");
  }

  const age = Date.now() - message.createdAt.getTime();
  if (age > CHAT.deleteEveryoneWindowMs) {
    throw new MessageServiceError("Delete window expired", 400, "DELETE_EXPIRED");
  }

  await prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      text: null,
      imageUrl: null,
      audioUrl: null,
    },
  });
}

export async function addReaction(
  userId: string,
  messageId: string,
  emoji: string,
): Promise<MessageView> {
  if (!isValidEmoji(emoji)) {
    throw new MessageServiceError("Invalid emoji", 400, "VALIDATION");
  }

  const rate = await checkRateLimit(
    `react:${userId}`,
    CHAT.reactionRateLimit.maxAttempts,
    CHAT.reactionRateLimit.windowMs,
  );
  if (!rate.allowed) {
    throw new MessageServiceError("Too many reactions", 429, "RATE_LIMITED");
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message) {
    throw new MessageServiceError("Message not found", 404, "NOT_FOUND");
  }

  await assertConversationAccess(userId, message.conversationId);

  await prisma.messageReaction.upsert({
    where: { messageId_userId: { messageId, userId } },
    create: { messageId, userId, emoji },
    update: { emoji },
  });

  const updated = await prisma.message.findUniqueOrThrow({
    where: { id: messageId },
    include: messageInclude,
  });

  const view = mapMessage(updated, userId);
  const otherUserId = await getOtherUserIdForConversation(
    message.conversationId,
    userId,
  );

  if (otherUserId && otherUserId !== userId) {
    await createNotification({
      userId: otherUserId,
      type: "LIKE",
      title: "New reaction",
      body: `${emoji} on your message`,
      data: { messageId, conversationId: message.conversationId, userId },
    });
  }

  return view;
}

export async function markMessagesDelivered(
  userId: string,
  conversationId: string,
  messageIds: string[],
): Promise<{ messageIds: string[]; deliveredAt: string }> {
  await assertConversationAccess(userId, conversationId);

  const now = new Date();
  await prisma.message.updateMany({
    where: {
      id: { in: messageIds },
      conversationId,
      senderId: { not: userId },
      deliveredAt: null,
    },
    data: { deliveredAt: now },
  });

  return {
    messageIds,
    deliveredAt: now.toISOString(),
  };
}

export async function markMessagesSeen(
  userId: string,
  conversationId: string,
  messageIds: string[],
): Promise<{ messageIds: string[]; seenAt: string }> {
  await assertConversationAccess(userId, conversationId);

  const now = new Date();
  await prisma.message.updateMany({
    where: {
      id: { in: messageIds },
      conversationId,
      senderId: { not: userId },
      seenAt: null,
    },
    data: { seenAt: now },
  });

  await markConversationRead(userId, conversationId);

  return {
    messageIds,
    seenAt: now.toISOString(),
  };
}
