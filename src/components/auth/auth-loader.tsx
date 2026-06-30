import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthLoaderProps {
  className?: string;
  label?: string;
}

export function AuthLoader({ className, label = "Loading..." }: AuthLoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-sm text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
