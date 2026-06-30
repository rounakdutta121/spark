"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { notificationLink } from "@/lib/social/notification-display";
import { notifyNotificationsUpdated } from "@/lib/social/notification-events";
import { InfiniteScrollSentinel } from "@/components/layout/main-shell";
import { PageLoader } from "@/components/shared/loading";
import { GlassCard } from "@/components/shared/glass-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { NotificationView } from "@/types/social";
import { cn } from "@/lib/utils";

function mergeNotifications(
  prev: NotificationView[],
  next: NotificationView[],
  reset: boolean,
): NotificationView[] {
  if (reset) return next;
  const seen = new Set(prev.map((n) => n.id));
  return [...prev, ...next.filter((n) => !seen.has(n.id))];
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationView[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const viewedIdsRef = useRef<string[]>([]);

  const deleteNotifications = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    await apiClient("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ ids }),
    });
    notifyNotificationsUpdated();
  }, []);

  const removeViewed = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setItems((prev) => prev.filter((n) => !idSet.has(n.id)));
    viewedIdsRef.current = viewedIdsRef.current.filter((id) => !idSet.has(id));
  }, []);

  const handleNotificationViewed = useCallback(
    async (id: string) => {
      if (!viewedIdsRef.current.includes(id)) return;
      try {
        await deleteNotifications([id]);
        removeViewed([id]);
      } catch {
        toast.error("Could not clear notification");
      }
    },
    [deleteNotifications, removeViewed],
  );

  const load = useCallback(async (reset = false) => {
    if (!reset && !hasMoreRef.current) return;
    if (loadingRef.current) return;

    loadingRef.current = true;
    if (reset) {
      cursorRef.current = null;
      hasMoreRef.current = true;
      viewedIdsRef.current = [];
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (!reset && cursorRef.current) params.set("cursor", cursorRef.current);
      const data = await apiClient<{
        notifications: NotificationView[];
        nextCursor: string | null;
        hasMore: boolean;
      }>(`/api/notifications${params.toString() ? `?${params}` : ""}`);

      setItems((prev) => mergeNotifications(prev, data.notifications, reset));
      viewedIdsRef.current = [
        ...new Set([
          ...viewedIdsRef.current,
          ...data.notifications.map((n) => n.id),
        ]),
      ];
      cursorRef.current = data.nextCursor;
      hasMoreRef.current = data.hasMore;
      setHasMore(data.hasMore);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    return () => {
      const ids = [...viewedIdsRef.current];
      if (ids.length === 0) return;
      void deleteNotifications(ids).catch(() => {});
    };
  }, [deleteNotifications]);

  if (loading && items.length === 0) {
    return <PageLoader label="Loading notifications…" />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          When someone likes, comments, follows you, or posts a story, you&apos;ll see it here.
        </p>
      ) : (
        items.map((n) => {
          const href = notificationLink(n.data);
          const inner = (
            <GlassCard
              className={cn(
                "flex items-start gap-3 p-4 transition-colors",
                !n.read && "border-[#FF4458]/30 bg-[#FF4458]/5",
              )}
            >
              <UserAvatar
                name={n.actor?.name ?? "?"}
                photoUrl={n.actor?.photoUrl ?? null}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{n.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            </GlassCard>
          );
          return href ? (
            <Link
              key={n.id}
              href={href}
              onClick={() => void handleNotificationViewed(n.id)}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={n.id}
              type="button"
              className="block w-full text-left"
              onClick={() => void handleNotificationViewed(n.id)}
            >
              {inner}
            </button>
          );
        })
      )}
      <InfiniteScrollSentinel
        onVisible={() => void load(false)}
        disabled={!hasMore || loadingMore || loading}
      />
    </div>
  );
}
