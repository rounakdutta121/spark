"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { NOTIFICATIONS_UPDATED_EVENT } from "@/lib/social/notification-events";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;
const INITIAL_DELAY_MS = 2_000;

export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () => {
      void apiClient<{ unreadCount: number }>("/api/notifications?countOnly=1")
        .then((data) => setUnread(data.unreadCount))
        .catch(() => {});
    };

    const initial = window.setTimeout(load, INITIAL_DELAY_MS);
    const interval = window.setInterval(load, POLL_MS);
    const onUpdate = () => load();
    window.addEventListener("focus", onUpdate);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.removeEventListener("focus", onUpdate);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    };
  }, []);

  return (
    <Link
      href={ROUTES.notifications}
      className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Notifications"
    >
      <Bell className="size-5" />
      {unread > 0 && (
        <span
          className={cn(
            "absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-[#FF4458] px-1 text-[10px] font-bold text-white",
          )}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
