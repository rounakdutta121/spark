"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { ROUTES } from "@/lib/constants";
import { InfiniteScrollSentinel } from "@/components/layout/main-shell";
import { PageLoader } from "@/components/shared/loading";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { FollowListResponse, FollowUserView } from "@/types/social";

type FollowListType = "followers" | "following";

interface FollowListSheetProps {
  userId: string;
  type: FollowListType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FollowListSheet({
  userId,
  type,
  open,
  onOpenChange,
}: FollowListSheetProps) {
  const [users, setUsers] = useState<FollowUserView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (reset = false) => {
      if (!type) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (!reset && cursor) params.set("cursor", cursor);
        const endpoint =
          type === "followers"
            ? `/api/users/${userId}/followers`
            : `/api/users/${userId}/following`;
        const data = await apiClient<FollowListResponse>(
          `${endpoint}${params.toString() ? `?${params}` : ""}`,
        );
        setUsers((prev) => (reset ? data.users : [...prev, ...data.users]));
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [cursor, type, userId],
  );

  useEffect(() => {
    if (!open || !type) return;
    setUsers([]);
    setCursor(null);
    setHasMore(true);
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, userId]);

  const title = type === "followers" ? "Followers" : "Following";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1">
          {loading && users.length === 0 ? (
            <PageLoader label={`Loading ${title.toLowerCase()}…`} />
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No {title.toLowerCase()} yet
            </p>
          ) : (
            users.map((user) => (
              <Link
                key={user.id}
                href={ROUTES.userProfile(user.id)}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/50"
              >
                <UserAvatar name={user.name} photoUrl={user.photoUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                {user.username && (
                  <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                )}
              </div>
            </Link>
            ))
          )}
          <InfiniteScrollSentinel
            onVisible={() => void load(false)}
            disabled={!hasMore || loading}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
