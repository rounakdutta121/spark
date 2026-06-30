"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UPLOAD } from "@/lib/constants";

interface PhotoUploadProps {
  onUpload: (file: File) => Promise<unknown>;
  currentCount: number;
  disabled?: boolean;
  className?: string;
}

export function PhotoUpload({
  onUpload,
  currentCount,
  disabled,
  className,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUpload = currentCount < UPLOAD.maxPhotos;

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (!canUpload) return null;

  return (
    <div className={className}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex aspect-[3/4] w-full flex-col items-center justify-center gap-2",
          "rounded-2xl border-2 border-dashed border-[#FF4458]/40 bg-[#FF4458]/5",
          "text-sm text-muted-foreground transition-colors hover:border-[#FF4458] hover:bg-[#FF4458]/10",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        {uploading ? (
          <Loader2 className="size-8 animate-spin text-[#FF4458]" />
        ) : (
          <Camera className="size-8 text-[#FF4458]" />
        )}
        <span>{uploading ? "Uploading..." : "Add photo"}</span>
        <span className="text-xs">
          {currentCount}/{UPLOAD.maxPhotos}
        </span>
      </motion.button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
