"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Heart, Send } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ButtonLoader } from "@/components/shared/loading";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { CommentView } from "@/types/social";
import { cn } from "@/lib/utils";

interface PostCommentsProps {
  postId: string;
  onCountChange?: (delta: number) => void;
}

export function PostComments({ postId, onCountChange }: PostCommentsProps) {
  const [comments, setComments] = useState<CommentView[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiClient<{ comments: CommentView[] }>(
        `/api/posts/${postId}/comments`,
      );
      setComments(data.comments);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiClient<{ comment: CommentView }>(
        `/api/posts/${postId}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ text: text.trim(), parentId: replyTo ?? undefined }),
        },
      );
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo
              ? { ...c, replies: [...(c.replies ?? []), res.comment] }
              : c,
          ),
        );
      } else {
        setComments((prev) => [res.comment, ...prev]);
      }
      onCountChange?.(1);
      setText("");
      setReplyTo(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to comment");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    try {
      const res = await apiClient<{ liked: boolean }>(
        `/api/comments/${commentId}/like`,
        { method: "POST" },
      );
      const update = (list: CommentView[]): CommentView[] =>
        list.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              likedByMe: res.liked,
              likeCount: c.likeCount + (res.liked ? 1 : -1),
            };
          }
          if (c.replies?.length) return { ...c, replies: update(c.replies) };
          return c;
        });
      setComments(update);
    } catch {
      toast.error("Could not like comment");
    }
  };

  const renderComment = (c: CommentView, nested = false) => (
    <div key={c.id} className={cn("flex gap-2", nested && "ml-8 mt-2")}>
      <UserAvatar name={c.author.name} photoUrl={c.author.photoUrl} size="sm" />
      <div className="flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-semibold">{c.author.name}</span> {c.text}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <button type="button" onClick={() => void toggleLike(c.id)}>
            <Heart className={cn("inline size-3", c.likedByMe && "fill-[#FF4458] text-[#FF4458]")} />
            {c.likeCount > 0 && ` ${c.likeCount}`}
          </button>
          {!nested && (
            <button type="button" onClick={() => setReplyTo(c.id)}>Reply</button>
          )}
        </div>
        {c.replies?.map((r) => renderComment(r, true))}
      </div>
    </div>
  );

  if (loading) return <LoadingSkeleton variant="list" className="py-4" />;

  return (
    <div className="space-y-4">
      {replyTo && (
        <p className="text-xs text-muted-foreground">
          Replying…{" "}
          <button type="button" className="text-[#FF4458]" onClick={() => setReplyTo(null)}>
            Cancel
          </button>
        </p>
      )}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-full border border-white/10 bg-background/50 px-4 py-2 text-sm outline-none"
          onKeyDown={(e) => e.key === "Enter" && void submit()}
        />
        <ButtonLoader loading={submitting} onClick={() => void submit()}>
          <Send className="size-4" />
        </ButtonLoader>
      </div>
      {comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No comments yet</p>
      ) : (
        comments.map((c) => renderComment(c))
      )}
    </div>
  );
}
