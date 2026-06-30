"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { apiForgotPassword } from "@/services/auth/auth.api";
import { ROUTES } from "@/lib/constants";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiForgotPassword(email);
      setSent(true);
      toast.success("Check your email for a reset link");
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Reset password" subtitle="We'll email you a reset link">
      {sent ? (
        <p className="text-center text-sm text-muted-foreground">
          If an account exists for that email, you&apos;ll receive instructions shortly.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <AuthButton type="submit" loading={loading} className="w-full">
            Send reset link
          </AuthButton>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link href={ROUTES.login} className="text-[#FF4458] hover:underline">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
