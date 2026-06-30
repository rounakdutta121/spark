import type { MessageType } from "@prisma/client";
import type { MessageView } from "@/types/chat";

export const messageInclude = {
  replyTo: {
    select: {
      id: true,
      type: true,
      text: true,
      senderId: true,
      isDeleted: true,
    },
  },
  reactions: true,
  hides: { select: { userId: true } },
} as const;

export function mapMessage(
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    type: MessageType;
    text: string | null;
    imageUrl: string | null;
    audioUrl: string | null;
    isEdited: boolean;
    isDeleted: boolean;
    deliveredAt: Date | null;
    seenAt: Date | null;
    createdAt: Date;
    replyTo: {
      id: string;
      type: MessageType;
      text: string | null;
      senderId: string;
      isDeleted: boolean;
    } | null;
    reactions: { id: string; userId: string; emoji: string }[];
    hides: { userId: string }[];
  },
  viewerId: string,
): MessageView {
  const hidden = message.hides.some((h) => h.userId === viewerId);
  const deletedForYou = hidden && !message.isDeleted;

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    type: message.type,
    text: message.isDeleted || deletedForYou ? null : message.text,
    imageUrl: message.isDeleted || deletedForYou ? null : message.imageUrl,
    audioUrl: message.isDeleted || deletedForYou ? null : message.audioUrl,
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          type: message.replyTo.type,
          text: message.replyTo.isDeleted ? null : message.replyTo.text,
          senderId: message.replyTo.senderId,
          isDeleted: message.replyTo.isDeleted,
        }
      : null,
    isEdited: message.isEdited,
    isDeleted: message.isDeleted || deletedForYou,
    deletedForYou,
    deliveredAt: message.deliveredAt?.toISOString() ?? null,
    seenAt: message.seenAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
    reactions: message.reactions,
  };
}
