import { CHAT } from "@/lib/constants";
import { sleep } from "@/utils";
import { prisma } from "@/lib/prisma";
import {
  assertConversationAccess,
  ChatAccessError,
} from "@/services/chat/access.service";
import type { MessageView } from "@/types/chat";
import { mapMessage, messageInclude } from "@/services/chat/message.mapper";

export interface ChatPollResult {
  messages: MessageView[];
  typingUserIds: string[];
  serverTime: string;
}

const ONLINE_WINDOW_MS = 60_000;

export function isRecentlyActive(lastActiveAt: Date): boolean {
  return Date.now() - lastActiveAt.getTime() < ONLINE_WINDOW_MS;
}

async function fetchConversationChanges(
  userId: string,
  conversationId: string,
  since: Date,
): Promise<ChatPollResult> {
  const now = new Date();

  const [messages, typingRows] = await Promise.all([
    prisma.message.findMany({
      where: {
        conversationId,
        NOT: { hides: { some: { userId } } },
        OR: [{ createdAt: { gt: since } }, { updatedAt: { gt: since } }],
      },
      include: messageInclude,
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.chatTyping.findMany({
      where: {
        conversationId,
        expiresAt: { gt: now },
        userId: { not: userId },
      },
      select: { userId: true },
    }),
  ]);

  return {
    messages: messages.map((m) => mapMessage(m, userId)),
    typingUserIds: typingRows.map((t) => t.userId),
    serverTime: now.toISOString(),
  };
}

export async function pollConversationUpdates(
  userId: string,
  conversationId: string,
  options: { since?: string; timeoutMs?: number },
): Promise<ChatPollResult> {
  await assertConversationAccess(userId, conversationId);

  const since = options.since ? new Date(options.since) : new Date(0);
  const timeoutMs = Math.min(
    options.timeoutMs ?? CHAT.pollActiveTimeoutMs,
    8_000,
  );
  const deadline = Date.now() + timeoutMs;
  const pollIntervalMs = CHAT.pollServerIntervalMs;

  while (Date.now() < deadline) {
    const result = await fetchConversationChanges(userId, conversationId, since);
    if (result.messages.length > 0 || result.typingUserIds.length > 0) {
      return result;
    }
    await sleep(pollIntervalMs);
  }

  return fetchConversationChanges(userId, conversationId, since);
}

export async function setTypingState(
  userId: string,
  conversationId: string,
  isTyping: boolean,
): Promise<void> {
  await assertConversationAccess(userId, conversationId);

  if (!isTyping) {
    await prisma.chatTyping.deleteMany({
      where: { conversationId, userId },
    });
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 4_000);

  await prisma.$transaction([
    prisma.chatTyping.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
    prisma.chatTyping.upsert({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      create: { conversationId, userId, expiresAt },
      update: { expiresAt },
    }),
  ]);
}

export async function touchUserPresence(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });
}

export async function getOnlineUserIds(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      lastActiveAt: { gte: cutoff },
    },
    select: { id: true },
  });

  return new Set(users.map((u) => u.id));
}

export { ChatAccessError };
