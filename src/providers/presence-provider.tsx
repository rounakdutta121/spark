"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthContext } from "@/providers/auth-provider";

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) return;

    const ping = () => {
      void apiClient("/api/presence/heartbeat", { method: "POST" }).catch(() => {});
    };

    ping();
    const interval = window.setInterval(ping, 30_000);
    window.addEventListener("focus", ping);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", ping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return children;
}
