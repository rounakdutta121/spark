"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import { UPLOAD } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUploader({
  onSelect,
  disabled,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD.allowedImageTypes.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50",
          className,
        )}
        aria-label="Upload image"
      >
        <ImagePlus className="size-5" />
      </button>
    </>
  );
}
