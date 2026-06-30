"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.ComponentProps<typeof Input> {
  label: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { label, error, className, id, name, autoComplete, ...props },
    ref,
  ) {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? name;

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </Label>
        <div className="relative">
          <Input
            ref={ref}
            id={inputId}
            name={name}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete ?? "current-password"}
            className={cn(
              "h-11 rounded-xl bg-background/50 pr-12 backdrop-blur-sm",
              error && "border-destructive focus-visible:ring-destructive/30",
              className,
            )}
            aria-invalid={!!error}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
