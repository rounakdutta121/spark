"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaDisplayProps {
  src: string;
  alt: string;
  type?: "IMAGE" | "VIDEO";
  fill?: boolean;
  className?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  /** Feed-style autoplay for videos (starts muted). */
  autoPlayVideo?: boolean;
  loopVideo?: boolean;
  showVideoControls?: boolean;
  showVideoBadge?: boolean;
  showMuteToggle?: boolean;
  onVideoEnded?: () => void;
}

function VideoWithMuteToggle({
  src,
  fill,
  className,
  autoPlay,
  loop,
  showControls,
  showMuteToggle,
  onEnded,
}: {
  src: string;
  fill?: boolean;
  className?: string;
  autoPlay: boolean;
  loop: boolean;
  showControls: boolean;
  showMuteToggle: boolean;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const fillClass = fill ? "absolute inset-0 size-full" : "size-full";

  useEffect(() => {
    setMuted(true);
  }, [src]);

  const toggleMute = (event: React.MouseEvent) => {
    event.stopPropagation();
    setMuted((current) => {
      const next = !current;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  };

  return (
    <div className={cn("relative", fill && "size-full")}>
      <video
        ref={videoRef}
        src={src}
        className={cn(fillClass, className)}
        controls={showControls && !autoPlay}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        preload="metadata"
        onEnded={onEnded}
      />
      {showMuteToggle && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-3 right-3 z-20 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
          aria-label={muted ? "Unmute video" : "Mute video"}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      )}
    </div>
  );
}

/** Renders post media; uses native img/video for authenticated /api/media URLs. */
export function MediaDisplay({
  src,
  alt,
  type = "IMAGE",
  fill,
  className,
  sizes,
  loading,
  autoPlayVideo = false,
  loopVideo,
  showVideoControls = true,
  showVideoBadge = false,
  showMuteToggle,
  onVideoEnded,
}: MediaDisplayProps) {
  const fillClass = fill ? "absolute inset-0 size-full" : "size-full";

  if (type === "VIDEO") {
    const loop = loopVideo ?? autoPlayVideo;
    const muteToggle = showMuteToggle ?? autoPlayVideo;

    return (
      <div className={cn("relative", fill && "size-full")}>
        <VideoWithMuteToggle
          src={src}
          fill={fill}
          className={cn(!autoPlayVideo && "object-cover", className)}
          autoPlay={autoPlayVideo}
          loop={loop}
          showControls={showVideoControls}
          showMuteToggle={muteToggle}
          onEnded={onVideoEnded}
        />
        {showVideoBadge && (
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-black/60 p-1">
            <Play className="size-3 fill-white text-white" />
          </span>
        )}
      </div>
    );
  }

  const authMedia = src.startsWith("/api/media/");

  if (authMedia) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={cn(fillClass, "object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      loading={loading}
      unoptimized={src.startsWith("/uploads/")}
    />
  );
}

/** @deprecated Use MediaDisplay */
export const MediaImage = MediaDisplay;
