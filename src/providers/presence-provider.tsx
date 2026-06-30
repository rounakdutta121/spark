"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthContext } from "@/providers/auth-provider";

const HEARTBEAT_MS = 60_000;
const INITIAL_DELAY_MS = 5_000;

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) return;

    const ping = () => {
      void apiClient("/api/presence/heartbeat", { method: "POST" }).catch(() => {});
    };

    const initial = window.setTimeout(ping, INITIAL_DELAY_MS);
    const interval = window.setInterval(ping, HEARTBEAT_MS);
    const onFocus = () => ping();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user?.id]);

  return children;
}
