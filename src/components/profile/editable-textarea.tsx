import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface EditableTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const EditableTextArea = forwardRef<
  HTMLTextAreaElement,
  EditableTextAreaProps
>(function EditableTextArea(
  { label, error, hint, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm backdrop-blur-sm",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive",
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});
