import { Construction } from "lucide-react";
import { ButtonLink } from "@/components/shared/button-link";
import { GlassCard } from "@/components/shared/glass-card";
import { Logo } from "@/components/shared/logo";
import { ROUTES } from "@/lib/constants";

interface ComingSoonProps {
  title: string;
  description?: string;
  showBack?: boolean;
}

export function ComingSoon({
  title,
  description = "This feature is coming in the next build step.",
  showBack = true,
}: ComingSoonProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-1/4 size-72 rounded-full bg-[#FF4458]/10 blur-3xl" />
        <div className="absolute right-1/3 bottom-1/4 size-72 rounded-full bg-[#FF8E53]/10 blur-3xl" />
      </div>

      <GlassCard className="w-full max-w-md p-8 text-center">
        <Logo className="justify-center" />
        <div className="mx-auto mt-6 flex size-16 items-center justify-center rounded-2xl bg-[#FF4458]/10">
          <Construction className="size-8 text-[#FF4458]" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        {showBack && (
          <ButtonLink href={ROUTES.home} variant="outline" className="mt-8 rounded-full">
            Back to home
          </ButtonLink>
        )}
      </GlassCard>
    </div>
  );
}
