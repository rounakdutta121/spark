"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { PostCard } from "@/features/feed/components/post-card";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { PostView } from "@/types/social";

interface PostProfileViewerProps {
  posts: PostView[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  onPostsChange: Dispatch<SetStateAction<PostView[]>>;
}

export function PostProfileViewer({
  posts,
  index,
  onIndexChange,
  onPostsChange,
}: PostProfileViewerProps) {
  const open = index !== null && index >= 0 && index < posts.length;
  const post = open ? posts[index] : null;
  const hasPrev = open && index > 0;
  const hasNext = open && index < posts.length - 1;

  const updatePost = useCallback(
    (postId: string, patch: Partial<PostView>) => {
      onPostsChange((current) =>
        current.map((p) => (p.id === postId ? { ...p, ...patch } : p)),
      );
    },
    [onPostsChange],
  );

  const handleCommentCountChange = useCallback(
    (postId: string, count: number) => {
      updatePost(postId, { commentCount: count });
    },
    [updatePost],
  );

  const handleLike = async (postId: string) => {
    const current = posts.find((p) => p.id === postId);
    if (!current) return;
    try {
      const res = await apiClient<{ liked: boolean }>(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      updatePost(postId, {
        likedByMe: res.liked,
        likeCount: current.likeCount + (res.liked ? 1 : -1),
      });
    } catch {
      toast.error("Could not update like");
    }
  };

  const handleSave = (postId: string, saved: boolean) => {
    updatePost(postId, { savedByMe: saved });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onIndexChange(null)}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border-none p-0"
      >
        {post && (
          <>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                {hasPrev && (
                  <button
                    type="button"
                    onClick={() => onIndexChange(index! - 1)}
                    className="rounded-full p-1 hover:bg-muted"
                    aria-label="Previous post"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                )}
                <span className="text-sm text-muted-foreground">
                  {(index ?? 0) + 1} / {posts.length}
                </span>
                {hasNext && (
                  <button
                    type="button"
                    onClick={() => onIndexChange(index! + 1)}
                    className="rounded-full p-1 hover:bg-muted"
                    aria-label="Next post"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => onIndexChange(null)}
                className="rounded-full p-1 hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <PostCard
                key={post.id}
                post={post}
                inlineComments
                onLike={() => void handleLike(post.id)}
                onSave={(saved) => handleSave(post.id, saved)}
                onCommentCountChange={(count) =>
                  handleCommentCountChange(post.id, count)
                }
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
