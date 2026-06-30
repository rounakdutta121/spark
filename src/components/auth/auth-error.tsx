import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthErrorProps {
  message: string;
  className?: string;
}

export function AuthError({ message, className }: AuthErrorProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className,
      )}
      role="alert"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
