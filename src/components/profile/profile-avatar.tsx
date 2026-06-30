import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MediaDisplay } from "@/components/shared/media-image";
import { CheckCircle2 } from "lucide-react";

interface ProfileAvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  verified?: boolean;
  className?: string;
}

const sizes = {
  sm: "size-12 text-sm",
  md: "size-20 text-xl",
  lg: "size-28 text-3xl",
};

export function ProfileAvatar({
  src,
  name,
  size = "md",
  verified = false,
  className,
}: ProfileAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn("relative inline-flex", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full ring-2 ring-[#FF4458]/30",
          sizes[size],
        )}
      >
        {src ? (
          <MediaDisplay
            src={src}
            alt={name}
            fill
            className="object-cover"
            sizes="112px"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#FF4458] to-[#FF8E53] font-bold text-white">
            {initials}
          </div>
        )}
      </div>
      {verified && (
        <Badge className="absolute -bottom-1 -right-1 size-6 rounded-full bg-blue-500 p-0">
          <CheckCircle2 className="size-4 text-white" />
        </Badge>
      )}
    </div>
  );
}
