"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthLoader } from "@/components/auth/auth-loader";
import { apiResetPassword } from "@/services/auth/auth.api";
import { ROUTES } from "@/lib/constants";

function ResetPasswordContent() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }
    setLoading(true);
    try {
      await apiResetPassword({ token, password, confirmPassword: confirm });
      toast.success("Password updated");
      router.push(ROUTES.login);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="New password" subtitle="Choose a strong password">
      <form onSubmit={submit} className="space-y-4">
        <PasswordInput
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordInput
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <AuthButton type="submit" loading={loading} className="w-full">
          Update password
        </AuthButton>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href={ROUTES.login} className="text-[#FF4458] hover:underline">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLoader />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
