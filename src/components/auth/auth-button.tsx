"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthButtonProps extends React.ComponentProps<"button"> {
  loading?: boolean;
  loadingText?: string;
}

export function AuthButton({
  loading,
  loadingText = "Please wait...",
  children,
  disabled,
  className,
  type = "submit",
  ...props
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl",
        "bg-gradient-to-r from-[#FF4458] to-[#FF6B35] text-sm font-medium text-white",
        "transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
