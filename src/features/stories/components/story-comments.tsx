"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ButtonLoader } from "@/components/shared/loading";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { StoryCommentView } from "@/types/social";

interface StoryCommentsProps {
  storyId: string;
  onCommentAdded?: () => void;
}

export function StoryComments({ storyId, onCommentAdded }: StoryCommentsProps) {
  const [comments, setComments] = useState<StoryCommentView[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiClient<{ comments: StoryCommentView[] }>(
        `/api/stories/${storyId}/comments`,
      );
      setComments(data.comments.slice(0, 5));
    } catch {
      setComments([]);
    }
  }, [storyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiClient<{ comment: StoryCommentView }>(
        `/api/stories/${storyId}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ text: text.trim() }),
        },
      );
      setComments((prev) => [res.comment, ...prev].slice(0, 5));
      setText("");
      onCommentAdded?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {comments.length > 0 && (
        <div className="max-h-28 space-y-2 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 rounded-lg bg-black/40 px-2 py-1.5">
              <UserAvatar name={c.author.name} photoUrl={c.author.photoUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{c.author.name}</p>
                <p className="text-sm text-white/90">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm text-white outline-none placeholder:text-white/50"
          onKeyDown={(e) => e.key === "Enter" && void submit()}
        />
        <ButtonLoader
          loading={submitting}
          onClick={() => void submit()}
          className="rounded-full bg-white/20 px-3 text-white hover:bg-white/30"
        >
          <Send className="size-4" />
        </ButtonLoader>
      </div>
    </div>
  );
}
