import { prisma } from "@/lib/prisma";
import {
  assertCanStartConversation,
  getOtherUserIdFromParticipants,
} from "@/services/chat/access.service";

export async function findConversationBetween(
  userId: string,
  otherUserId: string,
): Promise<string | null> {
  const mine = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  });
  if (mine.length === 0) return null;

  const shared = await prisma.conversationParticipant.findFirst({
    where: {
      userId: otherUserId,
      conversationId: { in: mine.map((m) => m.conversationId) },
    },
    select: { conversationId: true },
  });
  return shared?.conversationId ?? null;
}

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
): Promise<string> {
  await assertCanStartConversation(userId, otherUserId);

  const existingId = await findConversationBetween(userId, otherUserId);
  if (existingId) return existingId;

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
  });

  return conversation.id;
}

export async function getOtherUserIdForConversation(
  conversationId: string,
  userId: string,
): Promise<string> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  return getOtherUserIdFromParticipants(participants, userId);
}
