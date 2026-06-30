"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { detectNativeApp, getNativePlatform } from "@/lib/native-app";
import { useAuthContext } from "@/providers/auth-provider";

const LANDING_PATHS = new Set(["/", "/home"]);

/** Default status-bar inset when env(safe-area-inset-top) is 0 in Android WebView. */
const ANDROID_STATUS_BAR_PX = 44;

function applyNativeSafeArea(platform: "android" | "ios" | "web") {
  const root = document.documentElement;
  const body = document.body;

  root.classList.add("native-app");
  root.classList.add(`native-${platform}`);
  body.classList.add("native-app-body");

  const topInset =
    platform === "android"
      ? `${ANDROID_STATUS_BAR_PX}px`
      : "env(safe-area-inset-top, 20px)";
  const bottomInset =
    platform === "android" ? "24px" : "env(safe-area-inset-bottom, 20px)";

  root.style.setProperty("--app-safe-top", topInset);
  root.style.setProperty("--app-safe-bottom", bottomInset);
}

export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuthContext();

  useEffect(() => {
    if (!detectNativeApp()) return;

    const platform = getNativePlatform();
    applyNativeSafeArea(platform);

    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        // Let web content control top inset via --app-safe-top (avoids double offset).
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0a0a0a00" });
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
