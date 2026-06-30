import Link from "next/link";
import { WifiOff } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { ROUTES } from "@/lib/constants";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <GlassCard className="max-w-md p-10 text-center">
        <WifiOff className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">You&apos;re offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Check your internet connection and try again.
        </p>
        <Link
          href={ROUTES.feed}
          className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[#FF4458] to-[#FF6B35] px-6 py-2 text-sm font-medium text-white"
        >
          Retry
        </Link>
      </GlassCard>
    </div>
  );
}
