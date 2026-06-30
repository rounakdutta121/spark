"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthLoader } from "@/components/auth/auth-loader";
import { apiVerifyEmail } from "@/services/auth/auth.api";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/lib/constants";

function VerifyEmailContent() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "ok" | "error">(
    token ? "loading" : "error",
  );

  useEffect(() => {
    if (!token) return;
    apiVerifyEmail(token)
      .then(async () => {
        setStatus("ok");
        await refreshUser();
        toast.success("Email verified!");
        router.push(ROUTES.feed);
      })
      .catch(() => setStatus("error"));
  }, [token, refreshUser, router]);

  return (
    <AuthCard
      title={
        status === "loading"
          ? "Verifying…"
          : status === "ok"
            ? "Verified!"
            : "Verification failed"
      }
      subtitle={
        status === "loading"
          ? "Please wait"
          : status === "error"
            ? "This link may be invalid or expired"
            : "Redirecting…"
      }
    >
      {status === "error" && (
        <Link href={ROUTES.feed}>
          <AuthButton className="w-full">Continue</AuthButton>
        </Link>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthLoader />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
