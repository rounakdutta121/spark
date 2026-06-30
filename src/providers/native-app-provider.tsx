"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { detectNativeApp, getNativePlatform } from "@/lib/native-app";
import { useAuthContext } from "@/providers/auth-provider";

const LANDING_PATHS = new Set(["/", "/home"]);

export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuthContext();

  useEffect(() => {
    if (!detectNativeApp()) return;

    const platform = getNativePlatform();
    const root = document.documentElement;

    root.classList.add("native-app");
    root.classList.add(`native-${platform}`);

    // Android WebView often reports 0 for env(safe-area-*); use fallbacks.
    root.style.setProperty("--app-safe-top", "0px");
    root.style.setProperty(
      "--app-safe-bottom",
      platform === "android" ? "24px" : platform === "ios" ? "20px" : "0px",
    );

    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0a0a0a" });
      } catch {
        // optional plugin
      }

      try {
        const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        await Keyboard.setScroll({ isDisabled: false });
      } catch {
        // optional plugin
      }
    })();
  }, []);

  useEffect(() => {
    if (!detectNativeApp() || loading) return;
    if (!LANDING_PATHS.has(pathname)) return;

    router.replace(isAuthenticated ? ROUTES.feed : ROUTES.login);
  }, [pathname, isAuthenticated, loading, router]);

  return children;
}
