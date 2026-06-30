"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ROUTES } from "@/lib/constants";

export function NativeAppHeader() {
  return (
    <header className="native-app-header fixed inset-x-0 top-0 z-50 shrink-0 border-b border-white/10 bg-background/95 pt-[var(--app-safe-top)] backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-2 px-3">
        <Logo href={ROUTES.feed} showText size="sm" className="min-w-0 shrink" />
        <div className="flex shrink-0 items-center gap-0.5">
          <NotificationBell />
          <Link
            href={ROUTES.settings}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
