"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/shared/glass-card";
import { MediaDisplay } from "@/components/shared/media-image";
import { ProfileTap } from "@/components/profile/profile-tap";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PostComments } from "@/features/feed/components/post-comments";
import { apiClient } from "@/lib/api-client";
import type { PostView } from "@/types/social";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: PostView;
  onLike: () => void;
  onSave?: (saved: boolean) => void;
  onCommentCountChange?: (count: number) => void;
  inlineComments?: boolean;
}

export function PostCard({
  post,
  onLike,
  onSave,
  onCommentCountChange,
  inlineComments,
}: PostCardProps) {
  const [mediaIndex, setMediaIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const lastTap = useRef(0);
  const onCommentCountChangeRef = useRef(onCommentCountChange);

  useEffect(() => {
    onCommentCountChangeRef.current = onCommentCountChange;
  }, [onCommentCountChange]);

  useEffect(() => {
    setCommentCount(post.commentCount);
  }, [post.id, post.commentCount]);

  useEffect(() => {
    if (commentCount === post.commentCount) return;
    onCommentCountChangeRef.current?.(commentCount);
  }, [commentCount, post.commentCount]);

  const handleCommentDelta = (delta: number) => {
    setCommentCount((current) => current + delta);
  };

  const media = post.media[mediaIndex] ?? post.media[0];
  const hasCarousel = post.media.length > 1;

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!post.likedByMe) onLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap.current = now;
  };

  const handleSave = async () => {
    try {
      const res = await apiClient<{ saved: boolean }>(`/api/posts/${post.id}/save`, {
        method: "POST",
      });
      onSave?.(res.saved);
    } catch {
      // parent may handle toast
    }
  };

  return (
    <>
      <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <ProfileTap userId={post.author.id}>
              <div className="flex items-center gap-3">
                <div className="relative size-10 overflow-hidden rounded-full bg-muted">
                  {post.author.photoUrl && (
                    <MediaDisplay src={post.author.photoUrl} alt={post.author.name} fill className="object-cover" sizes="40px" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">{post.author.name}</p>
                  {post.author.username && (
                    <p className="text-xs text-muted-foreground">@{post.author.username}</p>
                  )}
                </div>
              </div>
            </ProfileTap>
          </div>

          {media && (
            <div
              className="relative aspect-square w-full bg-muted"
              onClick={handleDoubleTap}
              role="presentation"
            >
              <MediaDisplay
                src={media.url}
                alt={media.altText ?? post.caption ?? "Post"}
                type={media.type}
                fill
                className="object-cover"
                sizes="(max-width: 512px) 100vw, 512px"
                loading="lazy"
                autoPlayVideo={media.type === "VIDEO"}
                showVideoControls={media.type !== "VIDEO"}
              />
              <AnimatePresence>
                {showHeart && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <Heart className="size-24 fill-[#FF4458] text-[#FF4458] drop-shadow-lg" />
                  </motion.div>
                )}
              </AnimatePresence>
              {hasCarousel && (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMediaIndex((i) => Math.max(0, i - 1));
                    }}
                  >
                    <ChevronLeft className="size-5 text-white" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMediaIndex((i) => Math.min(post.media.length - 1, i + 1));
                    }}
                  >
                    <ChevronRight className="size-5 text-white" />
                  </button>
                </>
              )}
            </div>
          )}

          <div className="space-y-2 px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onLike}
                className="flex items-center gap-1 text-sm transition-transform active:scale-110"
              >
                <Heart className={cn("size-6", post.likedByMe && "fill-[#FF4458] text-[#FF4458]")} />
                <span>{post.likeCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                className="flex items-center gap-1 text-sm text-muted-foreground"
              >
                <MessageCircle className="size-6" />
                {commentCount}
              </button>
              <button type="button" onClick={() => void handleSave()} className="ml-auto">
                <Bookmark className={cn("size-6", post.savedByMe && "fill-current text-[#FF4458]")} />
              </button>
            </div>
            {post.caption && (
              <p className="text-sm">
                <span className="font-semibold">{post.author.name} </span>
                {post.caption}
              </p>
            )}
            {post.hashtags.length > 0 && (
              <p className="text-xs text-[#FF4458]">{post.hashtags.map((h) => `#${h}`).join(" ")}</p>
            )}
            {post.location && <p className="text-xs text-muted-foreground">{post.location}</p>}
            {inlineComments && (
              <div className="border-t border-white/10 pt-3">
                <PostComments
                  postId={post.id}
                  onCountChange={handleCommentDelta}
                />
              </div>
            )}
          </div>
        </GlassCard>
      </motion.article>

      {!inlineComments && (
      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>
          <PostComments
            postId={post.id}
            onCountChange={handleCommentDelta}
          />
        </SheetContent>
      </Sheet>
      )}
    </>
  );
}
