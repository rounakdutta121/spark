"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Home,
  MessageCircle,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NotificationBell } from "@/components/layout/notification-bell";
import { EmailVerificationBanner } from "@/components/layout/email-verification-banner";
import { NativeAppHeader } from "@/components/layout/native-app-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UploadPostModal } from "@/features/feed/components/upload-post-modal";
import { ROUTES } from "@/lib/constants";
import { useIsNativeApp } from "@/lib/native-app";
import { cn } from "@/lib/utils";

const LEFT_NAV = [
  { href: ROUTES.feed, label: "Home", icon: Home },
  { href: ROUTES.explore, label: "Explore", icon: Compass },
] as const;

const RIGHT_NAV = [
  { href: ROUTES.messages, label: "Messages", icon: MessageCircle },
  { href: ROUTES.profile, label: "Profile", icon: User },
] as const;

const DESKTOP_NAV = [
  { href: ROUTES.feed, label: "Home", icon: Home },
  { href: ROUTES.explore, label: "Explore", icon: Compass },
  { href: ROUTES.messages, label: "Messages", icon: MessageCircle },
  { href: ROUTES.profile, label: "Profile", icon: User },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  layout = "mobile",
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  layout?: "mobile" | "desktop";
}) {
  if (layout === "desktop") {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-[#FF4458]/10 text-[#FF4458]"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className={cn("size-5", active && "fill-current/20")} />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-[4.5rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors sm:min-w-[5rem] sm:text-xs",
        active ? "text-[#FF4458]" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("size-5 sm:size-6", active && "fill-current/20")} />
      {label}
    </Link>
  );
}

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [uploadOpen, setUploadOpen] = useState(false);
  const isNativeApp = useIsNativeApp();

  const isChatFullscreen = pathname.startsWith("/conversations/");
  const showWebHeader = !isNativeApp && !isChatFullscreen;
  const showNativeHeader = isNativeApp && !isChatFullscreen;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const logoHref = isNativeApp ? ROUTES.feed : ROUTES.home;

  return (
    <div
      className={cn(
        "app-shell bg-gradient-to-b from-background via-background to-muted/30",
        isNativeApp
          ? "flex h-[100dvh] flex-col overflow-hidden"
          : "min-h-[100dvh]",
        !isChatFullscreen &&
          !isNativeApp &&
          "pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0",
      )}
    >
      {showNativeHeader && <NativeAppHeader />}
      <EmailVerificationBanner />

      {showWebHeader && (
        <header className="sticky top-0 z-40 shrink-0 border-b border-white/10 bg-background/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
            <Logo href={logoHref} showText={false} size="sm" className="min-w-0 shrink" />
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="hidden items-center gap-2 rounded-full bg-gradient-to-br from-[#FF4458] to-[#FF6B35] px-4 py-2 text-sm font-medium text-white shadow-md shadow-[#FF4458]/20 transition-transform hover:scale-[1.02] active:scale-95 lg:inline-flex"
              >
                <Plus className="size-4" />
                Create
              </button>
              <NotificationBell />
              <Link
                href={ROUTES.settings}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Settings"
              >
                <Settings className="size-5" />
              </Link>
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
      )}

      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl lg:gap-8 lg:px-6 lg:py-6",
          isNativeApp && "min-h-0 flex-1 overflow-hidden",
          showNativeHeader && "pt-[calc(var(--app-safe-top)+3.5rem)]",
        )}
      >
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-56 shrink-0 lg:block">
          <nav className="space-y-1">
            {DESKTOP_NAV.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(item.href)} layout="desktop" />
            ))}
          </nav>
        </aside>

        <main
          className={cn(
            "min-w-0 flex-1",
            isChatFullscreen
              ? "flex min-h-0 flex-col overflow-hidden p-0"
              : "px-3 py-4 sm:px-6 sm:py-6 lg:max-w-2xl lg:px-0 lg:py-0 xl:max-w-3xl",
            isNativeApp &&
              !isChatFullscreen &&
              "min-h-0 overflow-y-auto overscroll-contain pb-[calc(var(--native-bottom-nav-h)+var(--app-safe-bottom))]",
            isNativeApp && isChatFullscreen && "min-h-0 overflow-hidden",
          )}
        >
          {children}
        </main>
      </div>

      {!isChatFullscreen && (
        <nav
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/95 backdrop-blur-xl lg:hidden",
            isNativeApp
              ? "native-bottom-nav pb-[var(--app-safe-bottom)]"
              : "pb-[env(safe-area-inset-bottom)]",
          )}
        >
          <div className="mx-auto flex max-w-lg items-end justify-between px-1 pb-1.5 pt-1 sm:max-w-xl sm:px-2 sm:pb-2">
            <div className="flex flex-1 justify-around">
              {LEFT_NAV.map((item) => (
                <NavLink key={item.href} {...item} active={isActive(item.href)} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="-mt-6 flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF4458] to-[#FF6B35] text-white shadow-lg shadow-[#FF4458]/30 transition-transform hover:scale-105 active:scale-95 sm:-mt-7 sm:size-14"
              aria-label="Create post"
            >
              <Plus className="size-6 stroke-[2.5] sm:size-7" />
            </button>

            <div className="flex flex-1 justify-around">
              {RIGHT_NAV.map((item) => (
                <NavLink key={item.href} {...item} active={isActive(item.href)} />
              ))}
            </div>
          </div>
        </nav>
      )}

      <UploadPostModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}

export function InfiniteScrollSentinel({
  onVisible,
  disabled,
}: {
  onVisible: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onVisible();
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled, onVisible]);

  return <div ref={ref} className="h-4" aria-hidden />;
}

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
