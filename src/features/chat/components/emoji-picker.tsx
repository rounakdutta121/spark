"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const EMOJI_LIST = [
  "😀", "😂", "🥰", "😍", "😘", "😊", "😉", "🤔", "😅", "😭",
  "👍", "👏", "🙌", "🔥", "❤️", "💕", "✨", "🎉", "💯", "🙏",
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Emoji picker"
      >
        😊
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 grid w-56 grid-cols-5 gap-1 rounded-2xl border border-white/10 bg-background/95 p-2 shadow-xl backdrop-blur-xl">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rounded-lg p-1.5 text-lg hover:bg-muted"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
