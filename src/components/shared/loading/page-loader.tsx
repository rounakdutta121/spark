import { Spinner } from "@/components/shared/loading/spinner";

interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = "Loading…" }: PageLoaderProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
