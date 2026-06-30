"use client";

import { Spinner } from "@/components/shared/loading/spinner";
import { cn } from "@/lib/utils";

interface ButtonLoaderProps {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
}

const variants = {
  primary:
    "bg-gradient-to-r from-[#FF4458] to-[#FF6B35] text-white hover:opacity-90",
  outline: "border border-white/20 bg-transparent hover:bg-white/5",
  ghost: "bg-transparent hover:bg-white/5",
};

export function ButtonLoader({
  loading,
  loadingText,
  children,
  className,
  disabled,
  type = "button",
  onClick,
  variant = "primary",
}: ButtonLoaderProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-opacity disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
