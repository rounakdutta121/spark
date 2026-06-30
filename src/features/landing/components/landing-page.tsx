"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  LandingCta,
  LandingFeatures,
  LandingHero,
  LandingHowItWorks,
  LandingStats,
} from "@/features/landing/components/landing-sections";
import { ROUTES } from "@/lib/constants";
import { useIsNativeApp } from "@/lib/native-app";
import { useAuthContext } from "@/providers/auth-provider";
import { PageLoader } from "@/components/shared/loading";

export function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthContext();
  const isNativeApp = useIsNativeApp();

  useEffect(() => {
    if (!isNativeApp || loading) return;
    router.replace(isAuthenticated ? ROUTES.feed : ROUTES.login);
  }, [isNativeApp, isAuthenticated, loading, router]);

  if (isNativeApp) {
    return <PageLoader label="Opening Spark…" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingCta />
      </main>
      <Footer />
    </div>
  );
}
