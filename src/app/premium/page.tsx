import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Premium",
};

export default function PremiumPage() {
  return (
    <ComingSoon
      title="Spark Premium"
      description="Unlimited swipes, boosts, and more — coming in Step 8."
    />
  );
}
