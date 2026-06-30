import { Suspense } from "react";
import { ExplorePage } from "@/features/explore/components/explore-page";
import { PageLoader } from "@/components/shared/loading";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader label="Loading explore…" />}>
      <ExplorePage />
    </Suspense>
  );
}
