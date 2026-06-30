import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadReceiptProps {
  deliveredAt: string | null;
  seenAt: string | null;
  isOwn: boolean;
}

export function ReadReceipt({ deliveredAt, seenAt, isOwn }: ReadReceiptProps) {
  if (!isOwn) return null;

  const seen = !!seenAt;
  const delivered = !!deliveredAt;

  return (
    <span
      className={cn(
        "inline-flex items-center",
        seen ? "text-sky-400" : "text-muted-foreground/70",
      )}
      aria-label={seen ? "Seen" : delivered ? "Delivered" : "Sent"}
    >
      {seen || delivered ? (
        <CheckCheck className="size-3.5" />
      ) : (
        <Check className="size-3.5" />
      )}
    </span>
  );
}
