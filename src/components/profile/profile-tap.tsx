"use client";

import type { ReactNode } from "react";
import { useUserProfile } from "@/providers/user-profile-provider";
import { cn } from "@/lib/utils";

interface ProfileTapProps {
  userId: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function ProfileTap({
  userId,
  disabled,
  className,
  children,
}: ProfileTapProps) {
  const { openProfile } = useUserProfile();

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => openProfile(userId)}
      className={cn(
        "rounded-xl text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4458]/50",
        className,
      )}
    >
      {children}
    </button>
  );
}
