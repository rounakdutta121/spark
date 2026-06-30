"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { InfiniteScrollSentinel } from "@/components/layout/main-shell";
import { PageLoader } from "@/components/shared/loading";
import { PostCard } from "@/features/feed/components/post-card";
import type { FeedResponse, PostView } from "@/types/social";

export function SavedPage() {
  const [posts, setPosts] = useState<PostView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (reset = false) => {
      try {
        const params = new URLSearchParams();
        if (!reset && cursor) params.set("cursor", cursor);
        const data = await apiClient<FeedResponse>(
          `/api/posts/saved${params.toString() ? `?${params}` : ""}`,
        );
        setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [cursor],
  );

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <PageLoader label="Loading saved posts…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved</h1>
        <p className="text-sm text-muted-foreground">Posts you saved</p>
      </div>
      {posts.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No saved posts yet</p>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onLike={() => undefined} />
        ))
      )}
      <InfiniteScrollSentinel onVisible={() => void load(false)} disabled={!hasMore} />
    </div>
  );
}
