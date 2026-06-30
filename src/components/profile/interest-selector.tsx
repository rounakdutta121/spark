"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterestOption } from "@/types/profile";
import { UPLOAD } from "@/lib/constants";

interface InterestSelectorProps {
  interests: InterestOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  max?: number;
}

function InterestIcon({ name }: { name: string }) {
  const icons = LucideIcons as unknown as Record<
    string,
    React.ComponentType<{ className?: string }>
  >;
  const pascalName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const Icon = icons[pascalName] ?? LucideIcons.Heart;
  return <Icon className="size-4" />;
}

export function InterestSelector({
  interests,
  selectedIds,
  onChange,
  disabled,
  max = UPLOAD.maxInterests,
}: InterestSelectorProps) {
  const toggle = (id: string) => {
    if (disabled) return;

    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
      return;
    }

    if (selectedIds.length >= max) return;
    onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Select up to {max} interests ({selectedIds.length}/{max})
      </p>
      <div className="flex flex-wrap gap-2">
        {interests.map((interest) => {
          const selected = selectedIds.includes(interest.id);
          const atLimit = !selected && selectedIds.length >= max;

          return (
            <motion.button
              key={interest.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              disabled={disabled || atLimit}
              onClick={() => toggle(interest.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all",
                selected
                  ? "border-[#FF4458] bg-[#FF4458]/15 text-[#FF4458]"
                  : "border-border bg-background/50 text-muted-foreground hover:border-[#FF4458]/50",
                atLimit && "opacity-40",
              )}
            >
              <InterestIcon name={interest.icon} />
              {interest.name}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
