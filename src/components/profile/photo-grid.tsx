"use client";

import { motion } from "framer-motion";
import { Star, Trash2, GripVertical } from "lucide-react";
import { MediaDisplay } from "@/components/shared/media-image";
import { cn } from "@/lib/utils";
import type { ProfilePhoto } from "@/types/profile";

interface PhotoGridProps {
  photos: ProfilePhoto[];
  onDelete?: (photoId: string) => void;
  onSetPrimary?: (photoId: string) => void;
  onReorder?: (photoIds: string[]) => void;
  disabled?: boolean;
}

export function PhotoGrid({
  photos,
  onDelete,
  onSetPrimary,
  disabled,
}: PhotoGridProps) {
  const sorted = [...photos].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {sorted.map((photo, index) => (
        <motion.div
          key={photo.id}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "group relative aspect-[3/4] overflow-hidden rounded-2xl",
            index === 0 && "col-span-2 row-span-1 sm:col-span-1",
          )}
        >
          <MediaDisplay
            src={photo.url}
            alt={`Photo ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 200px"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          <div className="absolute left-2 top-2 flex items-center gap-1">
            <GripVertical className="size-4 text-white/70" />
            {photo.isPrimary && (
              <span className="rounded-full bg-[#FF4458] px-2 py-0.5 text-xs font-medium text-white">
                Primary
              </span>
            )}
          </div>

          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {!photo.isPrimary && onSetPrimary && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSetPrimary(photo.id)}
                className="rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70"
                aria-label="Set as primary"
              >
                <Star className="size-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDelete(photo.id)}
                className="rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-red-500/80"
                aria-label="Delete photo"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
