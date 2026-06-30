"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { CHAT } from "@/lib/constants";
import { EmojiPicker } from "@/features/chat/components/emoji-picker";
import { ImageUploader } from "@/features/chat/components/image-uploader";
import { VoiceRecorder } from "@/features/chat/components/voice-recorder";
import type { MessageView } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  disabled?: boolean;
  replyTo: MessageView | null;
  onClearReply: () => void;
  onSendText: (text: string, replyToId?: string) => void;
  onSendImage: (file: File, replyToId?: string) => void;
  onSendAudio: (file: File, replyToId?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export function MessageComposer({
  disabled,
  replyTo,
  onClearReply,
  onSendText,
  onSendImage,
  onSendAudio,
  onTypingStart,
  onTypingStop,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTyping = useCallback(() => {
    onTypingStart();
    if (stopRef.current) clearTimeout(stopRef.current);
    stopRef.current = setTimeout(() => onTypingStop(), CHAT.typingStopDelayMs);
  }, [onTypingStart, onTypingStop]);

  useEffect(() => {
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
      if (stopRef.current) clearTimeout(stopRef.current);
    };
  }, []);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendText(trimmed, replyTo?.id);
    setText("");
    onTypingStop();
    onClearReply();
  };

  return (
    <div className="border-t border-white/10 bg-background/80 p-3 backdrop-blur-xl">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
          <div className="min-w-0 truncate">
            <span className="text-xs text-muted-foreground">Replying to </span>
            {replyTo.isDeleted ? "deleted message" : replyTo.text ?? "attachment"}
          </div>
          <button type="button" onClick={onClearReply} className="shrink-0 p-1">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-1">
        <EmojiPicker
          onSelect={(emoji) => {
            setText((t) => t + emoji);
            handleTyping();
          }}
        />
        <ImageUploader
          disabled={disabled}
          onSelect={(file) => {
            onSendImage(file, replyTo?.id);
            onClearReply();
          }}
        />
        <VoiceRecorder
          disabled={disabled}
          onRecorded={(file) => {
            onSendAudio(file, replyTo?.id);
            onClearReply();
          }}
        />

        <textarea
          value={text}
          rows={1}
          disabled={disabled}
          placeholder="Message…"
          className={cn(
            "max-h-28 min-h-[40px] flex-1 resize-none rounded-2xl border border-white/10 bg-muted/30 px-4 py-2.5 text-sm outline-none focus:border-[#FF4458]/40",
          )}
          onChange={(e) => {
            setText(e.target.value);
            if (typingRef.current) clearTimeout(typingRef.current);
            typingRef.current = setTimeout(handleTyping, CHAT.typingDebounceMs);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />

        <button
          type="button"
          disabled={disabled || !text.trim()}
          onClick={submit}
          className="rounded-full bg-gradient-to-r from-[#FF4458] to-[#FF6B35] p-2.5 text-white disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
