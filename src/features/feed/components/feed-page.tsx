"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { InfiniteScrollSentinel } from "@/components/layout/main-shell";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PostCard } from "@/features/feed/components/post-card";
import { StoriesBar } from "@/features/stories/components/stories-bar";
import { StoryViewer } from "@/features/stories/components/story-viewer";
import type { FeedResponse, PostView, StoryView } from "@/types/social";

export function FeedPage() {
  const [posts, setPosts] = useState<PostView[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [storyBundle, setStoryBundle] = useState<StoryView[] | null>(null);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);

  const load = useCallback(async (reset = false) => {
    if (!reset && !hasMoreRef.current) return;
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (!reset && cursorRef.current) params.set("cursor", cursorRef.current);
      const data = await apiClient<FeedResponse>(
        `/api/feed${params.toString() ? `?${params}` : ""}`,
      );
      setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
      setHasMore(data.hasMore);
      cursorRef.current = data.nextCursor;
      hasMoreRef.current = data.hasMore;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load feed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    const onPostCreated = (event: Event) => {
      const post = (event as CustomEvent<PostView>).detail;
      setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
    };
    window.addEventListener("post:created", onPostCreated);
    return () => window.removeEventListener("post:created", onPostCreated);
  }, []);

  const handleLike = async (postId: string) => {
    try {
      const res = await apiClient<{ liked: boolean }>(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: res.liked,
                likeCount: p.likeCount + (res.liked ? 1 : -1),
              }
            : p,
        ),
      );
    } catch {
      toast.error("Could not update like");
    }
  };

  const handleSave = (postId: string, saved: boolean) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, savedByMe: saved } : p)),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Home</h1>
        <p className="text-sm text-muted-foreground">Posts from people you follow</p>
      </div>

      <StoriesBar onOpenStory={(stories) => setStoryBundle(stories)} />

      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </div>
      ) : !loading && posts.length === 0 ? (
        <div className="py-16 text-center">
          <h2 className="text-lg font-semibold">Your feed is empty</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Follow people or head to Explore to discover and share posts.
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={() => void handleLike(post.id)}
            onSave={(saved) => handleSave(post.id, saved)}
          />
        ))
      )}

      <InfiniteScrollSentinel
        onVisible={() => void load(false)}
        disabled={!hasMore || loadingMore}
      />
      {loadingMore && <LoadingSkeleton variant="card" />}

      <StoryViewer
        stories={storyBundle ?? []}
        open={!!storyBundle?.length}
        onOpenChange={(open) => !open && setStoryBundle(null)}
      />
    </div>
  );
}
