"use client";

import { useEffect, useRef, useState } from "react";
import { Clapperboard, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared/glass-card";
import { MediaDisplay } from "@/components/shared/media-image";
import { ButtonLoader } from "@/components/shared/loading";
import { UPLOAD } from "@/lib/constants";
import { apiClient } from "@/lib/api-client";
import {
  shouldUseClientUpload,
  uploadFileToStorage,
  type UploadPurpose,
} from "@/lib/upload/client-upload";
import type { PostView } from "@/types/social";

interface PostComposerProps {
  onCreated?: (post: PostView) => void;
  onPosted?: () => void;
  embedded?: boolean;
}

type PreviewItem = {
  url: string;
  kind: "image" | "video";
};

const ACCEPT_MEDIA = [
  ...UPLOAD.allowedImageTypes,
  ...UPLOAD.allowedVideoTypes,
].join(",");

function isAllowedMedia(file: File): boolean {
  return (
    UPLOAD.allowedImageTypes.includes(file.type as (typeof UPLOAD.allowedImageTypes)[number]) ||
    UPLOAD.allowedVideoTypes.includes(file.type as (typeof UPLOAD.allowedVideoTypes)[number])
  );
}

export function PostComposer({ onCreated, onPosted, embedded }: PostComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const previewsRef = useRef<PreviewItem[]>([]);
  previewsRef.current = previews;

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  const pickFiles = (list: FileList | null) => {
    if (!list?.length) return;

    const incoming = Array.from(list).filter(isAllowedMedia);
    if (incoming.length < list.length) {
      toast.error("Some files were skipped. Use JPG, PNG, WebP, MP4, WebM, or MOV.");
    }

    const next = [...files, ...incoming].slice(0, UPLOAD.maxPostMedia);
    const added = next.slice(files.length);
    const newPreviews = added.map((f) => ({
      url: URL.createObjectURL(f),
      kind: f.type.startsWith("video/") ? ("video" as const) : ("image" as const),
    }));

    setFiles(next);
    setPreviews((prev) => [...prev, ...newPreviews]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setPreviews((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (files.length === 0) {
      toast.error("Add at least one photo or reel");
      return;
    }
    setLoading(true);
    try {
      const usePresigned = files.some((file) => shouldUseClientUpload(file));

      if (usePresigned) {
        const media = await Promise.all(
          files.map(async (file) => {
            const purpose: UploadPurpose = file.type.startsWith("video/")
              ? "post-video"
              : "post-image";
            const url = await uploadFileToStorage(file, purpose);
            return {
              url,
              type: file.type.startsWith("video/") ? ("VIDEO" as const) : ("IMAGE" as const),
            };
          }),
        );

        const res = await apiClient<{ post: PostView }>("/api/posts", {
          method: "POST",
          body: JSON.stringify({
            caption: caption || undefined,
            location: location || undefined,
            media,
          }),
        });
        toast.success("Post shared");
        setCaption("");
        setLocation("");
        previews.forEach((p) => URL.revokeObjectURL(p.url));
        setFiles([]);
        setPreviews([]);
        onCreated?.(res.post);
        window.dispatchEvent(new CustomEvent("post:created", { detail: res.post }));
        onPosted?.();
        return;
      }

      const form = new FormData();
      if (caption) form.append("caption", caption);
      if (location) form.append("location", location);
      files.forEach((f) => form.append("media", f));

      const res = await apiClient<{ post: PostView }>("/api/posts", {
        method: "POST",
        body: form,
      });
      toast.success("Post shared");
      setCaption("");
      setLocation("");
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setFiles([]);
      setPreviews([]);
      onCreated?.(res.post);
      window.dispatchEvent(new CustomEvent("post:created", { detail: res.post }));
      onPosted?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  const body = (
    <>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Write a caption… #hashtags @mentions"
        className="min-h-[72px] w-full resize-none rounded-xl border border-white/10 bg-background/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF4458]/40"
        maxLength={2200}
      />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="size-4" />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Add location"
          className="flex-1 bg-transparent outline-none"
          maxLength={120}
        />
      </div>
      {previews.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {previews.map((preview, i) => (
            <div key={preview.url} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              {preview.kind === "video" ? (
                <video
                  src={preview.url}
                  className="size-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <MediaDisplay src={preview.url} alt="" fill className="object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5"
              >
                <X className="size-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 text-sm text-[#FF4458]"
        >
          <Clapperboard className="size-5" />
          Photos & reels
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MEDIA}
          multiple
          className="hidden"
          onChange={(e) => pickFiles(e.target.files)}
        />
        <ButtonLoader loading={loading} onClick={() => void submit()} className="rounded-full px-6">
          Share
        </ButtonLoader>
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-3">{body}</div>;
  }

  return <GlassCard className="space-y-3 p-4">{body}</GlassCard>;
}
