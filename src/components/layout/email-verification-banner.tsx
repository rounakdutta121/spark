"use client";

import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiResendVerification } from "@/services/auth/auth.api";

export function EmailVerificationBanner() {
  const { user } = useAuth();

  if (!user || user.emailVerified) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 text-amber-200">
          <Mail className="size-4 shrink-0" />
          <span>Verify your email to post and message others.</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 rounded-full border-amber-500/40 text-xs"
          onClick={async () => {
            try {
              await apiResendVerification();
              toast.success("Verification email sent");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed to send");
            }
          }}
        >
          Resend
        </Button>
      </div>
    </div>
  );
}
