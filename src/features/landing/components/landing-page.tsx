import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  LandingCta,
  LandingFeatures,
  LandingHero,
  LandingHowItWorks,
  LandingStats,
} from "@/features/landing/components/landing-sections";

export function LandingPage() {
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
