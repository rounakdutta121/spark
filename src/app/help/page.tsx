import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Help Center",
};

export default function HelpPage() {
  return (
    <ComingSoon
      title="Help Center"
      description="FAQs and support documentation coming soon."
    />
  );
}
