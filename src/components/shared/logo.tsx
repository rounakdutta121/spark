import Link from "next/link";
import { Flame } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { icon: "size-5", text: "text-lg" },
  md: { icon: "size-6", text: "text-xl" },
  lg: { icon: "size-8", text: "text-2xl" },
};

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizes = sizeMap[size];

  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-bold tracking-tight", className)}
    >
      <span className="flex items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4458] to-[#FF8E53] p-1.5 shadow-lg shadow-[#FF4458]/25">
        <Flame className={cn(sizes.icon, "text-white")} />
      </span>
      {showText && (
        <span
          className={cn(
            sizes.text,
            "bg-gradient-to-r from-[#FF4458] to-[#FF8E53] bg-clip-text text-transparent",
          )}
        >
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}
