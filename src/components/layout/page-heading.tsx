"use client";

import { useIsNativeApp } from "@/lib/native-app";

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
}

/** Page title block — hidden in the native app (Spark logo bar is used instead). */
export function PageHeading({ title, subtitle, className }: PageHeadingProps) {
  const isNativeApp = useIsNativeApp();
  if (isNativeApp) return null;

  return (
    <div className={className}>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
