"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  MoreHorizontal,
  Pencil,
  Reply,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { CHAT } from "@/lib/constants";
import { ReadReceipt } from "@/features/chat/components/read-receipt";
import { AudioPlayer } from "@/features/chat/components/audio-player";
import type { MessageView } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: MessageView;
  isOwn: boolean;
  onReply: (message: MessageView) => void;
  onEdit: (message: MessageView) => void;
  onDelete: (message: MessageView, scope: "self" | "everyone") => void;
  onReact: (message: MessageView, emoji: string) => void;
}

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢"];

export function MessageBubble({
  message,
  isOwn,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const canModify =
    isOwn &&
    !message.isDeleted &&
    Date.now() - new Date(message.createdAt).getTime() < CHAT.editWindowMs;

  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const copyText = () => {
    if (message.text) {
      void navigator.clipboard.writeText(message.text);
      toast.success("Copied");
    }
    setMenuOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("group flex px-1", isOwn ? "justify-end" : "justify-start")}
    >
      <div className={cn("relative max-w-[82%]", isOwn ? "items-end" : "items-start")}>
        {message.replyTo && (
          <div className="mb-1 rounded-lg border-l-2 border-[#FF4458]/60 bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
            {message.replyTo.isDeleted
              ? "Message deleted"
              : message.replyTo.text ?? "Attachment"}
          </div>
        )}

        <div
          className={cn(
            "relative rounded-2xl px-3.5 py-2 shadow-sm",
            isOwn
              ? "rounded-br-md bg-gradient-to-br from-[#FF4458] to-[#FF6B35] text-white"
              : "rounded-bl-md border border-white/10 bg-muted/50 backdrop-blur-md",
          )}
        >
          {message.isDeleted ? (
            <p className="text-sm italic opacity-70">Message deleted</p>
          ) : message.type === "IMAGE" || message.type === "GIF" ? (
            message.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message.imageUrl}
                alt=""
                className="max-h-56 rounded-xl object-cover"
              />
            )
          ) : message.type === "AUDIO" && message.audioUrl ? (
            <AudioPlayer src={message.audioUrl} />
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm">
              {message.text}
              {message.isEdited && (
                <span className="ml-1 text-[10px] opacity-70">edited</span>
              )}
            </p>
          )}

          <div
            className={cn(
              "mt-1 flex items-center justify-end gap-1 text-[10px]",
              isOwn ? "text-white/80" : "text-muted-foreground",
            )}
          >
            <span>{time}</span>
            <ReadReceipt
              deliveredAt={message.deliveredAt}
              seenAt={message.seenAt}
              isOwn={isOwn}
            />
          </div>
        </div>

        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((r) => (
              <button
                key={r.id}
                type="button"
                className="rounded-full bg-muted/60 px-1.5 py-0.5 text-xs"
                onClick={() => onReact(message, r.emoji)}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            "absolute top-1 opacity-0 transition-opacity group-hover:opacity-100",
            isOwn ? "-left-8" : "-right-8",
          )}
        >
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "absolute z-20 min-w-[140px] rounded-xl border border-white/10 bg-background/95 py-1 shadow-xl backdrop-blur-xl",
                isOwn ? "right-0 top-full mt-1" : "left-0 top-full mt-1",
              )}
            >
              <div className="flex gap-1 border-b border-white/10 px-2 py-1.5">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-sm hover:scale-110"
                    onClick={() => {
                      onReact(message, emoji);
                      setMenuOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <MenuItem icon={Reply} label="Reply" onClick={() => { onReply(message); setMenuOpen(false); }} />
              {message.text && (
                <MenuItem icon={Copy} label="Copy" onClick={copyText} />
              )}
              {canModify && message.type === "TEXT" && (
                <MenuItem icon={Pencil} label="Edit" onClick={() => { onEdit(message); setMenuOpen(false); }} />
              )}
              <MenuItem icon={Trash2} label="Delete for me" onClick={() => { onDelete(message, "self"); setMenuOpen(false); }} />
              {canModify && (
                <MenuItem icon={Trash2} label="Delete for everyone" onClick={() => { onDelete(message, "everyone"); setMenuOpen(false); }} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Reply;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}
