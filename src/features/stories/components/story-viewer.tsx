"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { MediaDisplay } from "@/components/shared/media-image";
import { STORY_TTL_MS } from "@/lib/social/story-constants";
import { notifyStoriesRefresh } from "@/lib/social/story-events";
import { StoryComments } from "@/features/stories/components/story-comments";
import type { StoryView } from "@/types/social";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface StoryViewerProps {
  stories: StoryView[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoriesChange?: (stories: StoryView[]) => void;
}

function isStoryActive(story: StoryView): boolean {
  return new Date(story.expiresAt).getTime() > Date.now();
}

function timeRemainingLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h left`;
  return `${minutes}m left`;
}

export function StoryViewer({
  stories,
  open,
  onOpenChange,
  onStoriesChange,
}: StoryViewerProps) {
  const [index, setIndex] = useState(0);
  const [activeStories, setActiveStories] = useState<StoryView[]>([]);

  const syncActiveStories = useCallback(
    (list: StoryView[]) => {
      const next = list.filter(isStoryActive);
      setActiveStories(next);
      onStoriesChange?.(next);
      return next;
    },
    [onStoriesChange],
  );

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    syncActiveStories(stories);
  }, [open, stories, syncActiveStories]);

  const story = activeStories[index];

  const removeExpiredAndAdvance = useCallback(() => {
    setActiveStories((prev) => {
      const next = prev.filter(isStoryActive);
      if (next.length === 0) {
        notifyStoriesRefresh();
        onOpenChange(false);
        return next;
      }
      setIndex((i) => Math.min(i, next.length - 1));
      onStoriesChange?.(next);
      return next;
    });
  }, [onOpenChange, onStoriesChange]);

  useEffect(() => {
    if (!story || !open) return;
    void apiClient(`/api/stories/${story.id}/view`, { method: "POST" });
  }, [story, open]);

  useEffect(() => {
    if (!open || !story) return;

    const tick = () => {
      if (!isStoryActive(story)) {
        removeExpiredAndAdvance();
      }
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, [open, story, removeExpiredAndAdvance]);

  const progress = useMemo(() => {
    if (!story) return 0;
    const elapsed = Date.now() - new Date(story.createdAt).getTime();
    return Math.min(100, Math.max(0, (elapsed / STORY_TTL_MS) * 100));
  }, [story]);

  const goNext = () => {
    if (index < activeStories.length - 1) {
      setIndex((i) => i + 1);
      return;
    }
    onOpenChange(false);
  };

  const goPrev = () => {
    if (index > 0) setIndex((i) => i - 1);
  };

  if (!story) {
    if (open) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md border-none bg-black p-6 text-center text-white">
            <p className="text-sm">This story has expired.</p>
          </DialogContent>
        </Dialog>
      );
    }
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-none bg-black p-0">
        <div className="relative flex aspect-[9/16] w-full flex-col bg-black">
          {activeStories.length > 1 && (
            <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
              {activeStories.map((s, i) => (
                <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                  <div
                    className={cn(
                      "h-full bg-white transition-all",
                      i < index && "w-full",
                      i > index && "w-0",
                      i === index && "w-full",
                    )}
                    style={i === index ? { width: `${progress}%` } : undefined}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="relative min-h-0 flex-1">
            {story.mediaType === "VIDEO" ? (
              <MediaDisplay
                key={story.id}
                src={story.mediaUrl}
                alt=""
                type="VIDEO"
                fill
                className="object-contain"
                autoPlayVideo
                loopVideo={false}
                showVideoControls={false}
                onVideoEnded={goNext}
              />
            ) : (
              <MediaDisplay
                src={story.mediaUrl}
                alt=""
                fill
                className="object-contain"
              />
            )}
            <button
              type="button"
              className="absolute inset-y-0 left-0 w-1/3"
              onClick={goPrev}
              aria-label="Previous story"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-1/3"
              onClick={goNext}
              aria-label="Next story"
            />
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1"
          >
            <X className="size-5 text-white" />
          </button>

          <div className="absolute left-4 top-10 z-10 text-sm text-white">
            <p className="font-semibold">{story.author.name}</p>
            <p className="text-xs text-white/70">{timeRemainingLabel(story.expiresAt)}</p>
          </div>

          <div className="relative z-10 border-t border-white/10 bg-gradient-to-t from-black/90 to-transparent p-3">
            <StoryComments
              storyId={story.id}
              onCommentAdded={() => {
                setActiveStories((prev) =>
                  prev.map((s) =>
                    s.id === story.id
                      ? { ...s, commentCount: s.commentCount + 1 }
                      : s,
                  ),
                );
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
