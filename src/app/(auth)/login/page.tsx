import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { AuthLoader } from "@/components/auth/auth-loader";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <AuthLoader label="Loading..." />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
