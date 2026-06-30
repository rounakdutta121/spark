import { prisma } from "@/lib/prisma";
import { areUsersBlocked } from "@/services/moderation/block.service";
import { getFollowStatus } from "@/services/social/follow.service";

export class ChatAccessError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ChatAccessError";
  }
}

async function canMessageUser(
  senderId: string,
  recipientId: string,
): Promise<boolean> {
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    include: { settings: true },
  });
  if (!recipient?.isActive) return false;

  const permission = recipient.settings?.messagePermission ?? "EVERYONE";
  if (permission === "NONE") return false;
  if (permission === "EVERYONE") return true;

  const follow = await getFollowStatus(senderId, recipientId);
  return follow.isFollowing;
}

export async function assertConversationAccess(
  userId: string,
  conversationId: string,
) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    include: {
      conversation: {
        include: {
          participants: { select: { userId: true } },
        },
      },
    },
  });

  if (!participant) {
    throw new ChatAccessError("Conversation not found", 404, "NOT_FOUND");
  }

  const otherId = participant.conversation.participants.find(
    (p) => p.userId !== userId,
  )?.userId;

  if (!otherId) {
    throw new ChatAccessError("Conversation not found", 404, "NOT_FOUND");
  }

  if (await areUsersBlocked(userId, otherId)) {
    throw new ChatAccessError("Conversation not found", 404, "NOT_FOUND");
  }

  return participant.conversation;
}

export async function assertCanStartConversation(
  userId: string,
  otherUserId: string,
): Promise<void> {
  if (userId === otherUserId) {
    throw new ChatAccessError("Invalid recipient", 400);
  }
  if (await areUsersBlocked(userId, otherUserId)) {
    throw new ChatAccessError("User not found", 404);
  }
  const allowed = await canMessageUser(userId, otherUserId);
  if (!allowed) {
    throw new ChatAccessError("Messaging not allowed", 403, "FORBIDDEN");
  }
}

export function getOtherUserIdFromParticipants(
  participants: { userId: string }[],
  userId: string,
): string {
  const other = participants.find((p) => p.userId !== userId);
  if (!other) throw new ChatAccessError("Conversation not found", 404);
  return other.userId;
}
