"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/schemas/auth/login.schema";
import { useAuth } from "@/hooks/use-auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthError } from "@/components/auth/auth-error";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const redirect = searchParams.get("redirect") ?? ROUTES.feed;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data);
      toast.success("Welcome back!");
      router.push(redirect);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed";
      setError("root", { message });
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue your journey"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href={ROUTES.register}
            className="font-medium text-[#FF4458] hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        {errors.root && <AuthError message={errors.root.message ?? ""} />}

        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-[#FF4458]"
              {...register("rememberMe")}
            />
            <span className="text-muted-foreground">Remember me</span>
          </label>

          <Link
            href={ROUTES.forgotPassword}
            className="text-sm font-medium text-[#FF4458] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <AuthButton loading={isSubmitting} loadingText="Signing in...">
          Sign in
        </AuthButton>
      </motion.form>
    </AuthCard>
  );
}
