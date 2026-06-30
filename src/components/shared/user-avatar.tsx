import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-base" };

export function UserAvatar({
  name,
  photoUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const useAuthMedia = photoUrl?.startsWith("/api/media/");

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#FF4458]/30 to-[#FF6B35]/30",
        sizes[size],
        className,
      )}
    >
      {photoUrl ? (
        useAuthMedia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} className="size-full object-cover" />
        ) : (
          <Image src={photoUrl} alt={name} fill className="object-cover" sizes="56px" unoptimized />
        )
      ) : (
        <span className="flex h-full w-full items-center justify-center font-semibold">
          {initial}
        </span>
      )}
    </div>
  );
}
