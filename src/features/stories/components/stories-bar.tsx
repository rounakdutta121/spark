"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { MediaDisplay } from "@/components/shared/media-image";
import { UPLOAD } from "@/lib/constants";
import { STORY_MAX_VIDEO_SECONDS } from "@/lib/social/story-constants";
import { STORIES_REFRESH_EVENT } from "@/lib/social/story-events";
import { prepareStoryVideoFile } from "@/lib/upload/client-video-trim";
import {
  shouldUseClientUpload,
  uploadFileToStorage,
} from "@/lib/upload/client-upload";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import type { StoryView } from "@/types/social";
import { cn } from "@/lib/utils";

function isStoryActive(story: StoryView): boolean {
  return new Date(story.expiresAt).getTime() > Date.now();
}

interface StoriesBarProps {
  onOpenStory?: (stories: StoryView[], index: number) => void;
}

export function StoriesBar({ onOpenStory }: StoriesBarProps) {
  const [stories, setStories] = useState<StoryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadStories = useCallback(async () => {
    try {
      const r = await apiClient<{ stories: StoryView[] }>("/api/stories");
      setStories(r.stories.filter(isStoryActive));
    } catch {
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStories();
    const interval = window.setInterval(() => {
      setStories((prev) => prev.filter(isStoryActive));
    }, 60_000);
    const refresh = () => void loadStories();
    window.addEventListener(STORIES_REFRESH_EVENT, refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(STORIES_REFRESH_EVENT, refresh);
    };
  }, [loadStories]);

  const grouped = useMemo(() => {
    const map = new Map<string, StoryView[]>();
    for (const s of stories.filter(isStoryActive)) {
      const list = map.get(s.author.id) ?? [];
      list.push(s);
      map.set(s.author.id, list);
    }
    return [...map.entries()];
  }, [stories]);

  const uploadStory = async (file: File) => {
    setUploading(true);
    try {
      let uploadFile = file;
      let videoTrimmed = false;

      if (file.type.startsWith("video/")) {
        const prepared = await prepareStoryVideoFile(file);
        uploadFile = prepared.file;
        videoTrimmed = prepared.trimmed;
      }

      if (shouldUseClientUpload(uploadFile)) {
        const purpose = uploadFile.type.startsWith("video/") ? "story-video" : "story-image";
        const mediaUrl = await uploadFileToStorage(uploadFile, purpose);
        const res = await apiClient<{ story: StoryView; videoTrimmed?: boolean }>("/api/stories", {
          method: "POST",
          body: JSON.stringify({
            mediaUrl,
            mediaType: uploadFile.type.startsWith("video/") ? "VIDEO" : "IMAGE",
            videoTrimmed,
          }),
        });
        setStories((prev) => [res.story, ...prev.filter((s) => s.id !== res.story.id)]);
        toast.success(
          res.videoTrimmed
            ? `Story added — video trimmed to ${STORY_MAX_VIDEO_SECONDS}s`
            : "Story added — visible for 24 hours",
        );
        return;
      }

      const form = new FormData();
      form.append("media", file);
      const res = await apiClient<{ story: StoryView; videoTrimmed?: boolean }>("/api/stories", {
        method: "POST",
        body: form,
      });
      setStories((prev) => [res.story, ...prev.filter((s) => s.id !== res.story.id)]);
      toast.success(
        res.videoTrimmed
          ? `Story added — video trimmed to ${STORY_MAX_VIDEO_SECONDS}s`
          : "Story added — visible for 24 hours",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload story");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSkeleton variant="card" className="h-20" />;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      <label className="flex shrink-0 flex-col items-center gap-1">
        <span className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-[#FF4458]/50 bg-muted">
          {uploading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-[#FF4458] border-t-transparent" />
          ) : (
            <Plus className="size-5 text-[#FF4458]" />
          )}
        </span>
        <span className="text-[10px]">Your story</span>
        <input
          type="file"
          accept={[...UPLOAD.allowedImageTypes, ...UPLOAD.allowedVideoTypes].join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadStory(f);
          }}
        />
      </label>
      {grouped.map(([authorId, items], index) => {
        const author = items[0].author;
        const unseen = items.some((s) => !s.seenByMe);
        return (
          <button
            key={authorId}
            type="button"
            onClick={() => onOpenStory?.(items, index)}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <span
              className={cn(
                "rounded-full p-0.5",
                unseen
                  ? "bg-gradient-to-tr from-[#FF4458] to-[#FF8E53]"
                  : "bg-muted-foreground/30",
              )}
            >
              <span className="relative block size-14 overflow-hidden rounded-full border-2 border-background bg-muted">
                {author.photoUrl && (
                  <MediaDisplay src={author.photoUrl} alt="" fill className="object-cover" />
                )}
              </span>
            </span>
            <span className="max-w-[56px] truncate text-[10px]">{author.name.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}
