"use client";

import { useEffect, useState } from "react";

export type NativePlatform = "android" | "ios" | "web";

export function detectNativeApp(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Capacitor } = require("@capacitor/core") as typeof import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function getNativePlatform(): NativePlatform {
  if (typeof window === "undefined") return "web";

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Capacitor } = require("@capacitor/core") as typeof import("@capacitor/core");
    const platform = Capacitor.getPlatform();
    if (platform === "android" || platform === "ios") return platform;
    return "web";
  } catch {
    return "web";
  }
}

export function useIsNativeApp(): boolean {
  const [native, setNative] = useState(false);

  useEffect(() => {
    setNative(detectNativeApp());
  }, []);

  return native;
}

export function useNativePlatform(): NativePlatform {
  const [platform, setPlatform] = useState<NativePlatform>("web");

  useEffect(() => {
    setPlatform(getNativePlatform());
  }, []);

  return platform;
}
