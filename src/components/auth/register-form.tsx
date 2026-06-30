"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  registerSchema,
  type RegisterInput,
} from "@/schemas/auth/register.schema";
import { useAuth } from "@/hooks/use-auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthError } from "@/components/auth/auth-error";
import { ROUTES } from "@/lib/constants";

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: undefined },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerUser(data);
      toast.success("Account created! Check your email to verify your account.");
      router.push(ROUTES.editProfile);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      setError("root", { message });
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Spark and connect with people"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={ROUTES.login}
            className="font-medium text-[#FF4458] hover:underline"
          >
            Sign in
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
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          error={errors.name?.message}
          {...register("name")}
        />

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
          autoComplete="new-password"
          placeholder="Create a strong password"
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordInput
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Controller
          name="acceptTerms"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 rounded border-border accent-[#FF4458]"
                  checked={field.value === true}
                  onChange={(e) => field.onChange(e.target.checked ? true : undefined)}
                />
                <span className="text-muted-foreground">
                  I agree to the{" "}
                  <Link
                    href={ROUTES.terms}
                    className="font-medium text-[#FF4458] hover:underline"
                    target="_blank"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href={ROUTES.privacy}
                    className="font-medium text-[#FF4458] hover:underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>
          )}
        />

        <AuthButton loading={isSubmitting} loadingText="Creating account...">
          Create account
        </AuthButton>
      </motion.form>
    </AuthCard>
  );
}
