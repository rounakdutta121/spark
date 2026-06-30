"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared/glass-card";
import { ProfileTap } from "@/components/profile/profile-tap";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatRelativeTime } from "@/lib/date-format";
import { ROUTES } from "@/lib/constants";
import type { ConversationListItem } from "@/types/chat";
import { cn } from "@/lib/utils";

function previewText(
  conversation: ConversationListItem,
  viewerId?: string,
): string {
  const msg = conversation.lastMessage;
  if (!msg) return "Start the conversation";
  if (msg.isDeleted) return "Message deleted";
  if (msg.type === "IMAGE") return "📷 Photo";
  if (msg.type === "AUDIO") return "🎤 Voice message";
  if (msg.type === "GIF") return "GIF";
  const prefix = msg.senderId === viewerId ? "You: " : "";
  return `${prefix}${msg.text ?? ""}`;
}

interface ConversationCardProps {
  conversation: ConversationListItem;
  viewerId?: string;
  isOnline?: boolean;
}

export function ConversationCard({
  conversation,
  viewerId,
  isOnline,
}: ConversationCardProps) {
  const online = isOnline ?? conversation.otherUser.isOnline;

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <GlassCard hover className="flex items-center gap-3 p-4">
        <ProfileTap userId={conversation.otherUser.id} className="shrink-0">
          <div className="relative">
            <UserAvatar
              name={conversation.otherUser.name}
              photoUrl={conversation.otherUser.photoUrl}
              size="lg"
            />
            <span
              className={cn(
                "absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-background",
                online ? "bg-emerald-400" : "bg-muted-foreground/50",
              )}
            />
          </div>
        </ProfileTap>

        <Link
          href={ROUTES.conversation(conversation.id)}
          className="min-w-0 flex-1"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold">{conversation.otherUser.name}</p>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm text-muted-foreground">
              {previewText(conversation, viewerId)}
            </p>
            {conversation.unreadCount > 0 && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#FF4458] text-[10px] font-bold text-white">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </Link>
      </GlassCard>
    </motion.div>
  );
}
