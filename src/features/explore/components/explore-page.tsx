"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { InfiniteScrollSentinel } from "@/components/layout/main-shell";
import { PageLoader } from "@/components/shared/loading";
import { ProfileTap } from "@/components/profile/profile-tap";
import { PostCard } from "@/features/feed/components/post-card";
import type { ExploreResponse, PostView, SocialUserPreview } from "@/types/social";

function syncExploreUrl(q: string) {
  const url = q ? `/explore?q=${encodeURIComponent(q)}` : "/explore";
  window.history.replaceState(null, "", url);
}

export function ExplorePage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery.trim());
  const [posts, setPosts] = useState<PostView[]>([]);
  const [searchUsers, setSearchUsers] = useState<SocialUserPreview[]>([]);
  const [searchHashtags, setSearchHashtags] = useState<{ id: string; name: string }[]>([]);
  const [meta, setMeta] = useState<ExploreResponse["meta"]>();
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const activeQueryRef = useRef(activeQuery);
  activeQueryRef.current = activeQuery;

  const loadPosts = useCallback(async (reset = false) => {
    if (!reset && !hasMoreRef.current) return;

    const q = activeQueryRef.current;
    if (reset) setFetching(true);

    try {
      const params = new URLSearchParams();
      if (!q) params.set("meta", "1");
      else params.set("q", q);
      if (!reset && cursorRef.current) params.set("cursor", cursorRef.current);

      const data = await apiClient<ExploreResponse>(`/api/explore?${params}`);
      setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
      setHasMore(data.hasMore);
      cursorRef.current = data.nextCursor;
      hasMoreRef.current = data.hasMore;
      if (data.meta) setMeta(data.meta);
      else if (reset && q) setMeta(undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setFetching(false);
      setInitialLoading(false);
    }
  }, []);

  const loadSearchExtras = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchUsers([]);
      setSearchHashtags([]);
      return;
    }
    try {
      const data = await apiClient<{
        users: SocialUserPreview[];
        hashtags: { id: string; name: string }[];
      }>(`/api/search?q=${encodeURIComponent(q)}&type=all&limit=20`);
      setSearchUsers(data.users);
      setSearchHashtags(data.hashtags);
    } catch {
      setSearchUsers([]);
      setSearchHashtags([]);
    }
  }, []);

  const applySearch = useCallback((raw: string) => {
    const trimmed = raw.trim();
    setActiveQuery(trimmed);
    cursorRef.current = null;
    hasMoreRef.current = true;
    syncExploreUrl(trimmed);
  }, []);

  useEffect(() => {
    void loadPosts(true);
    void loadSearchExtras(activeQuery);
  }, [activeQuery, loadPosts, loadSearchExtras]);

  useEffect(() => {
    const onPostCreated = (event: Event) => {
      if (activeQueryRef.current) return;
      const post = (event as CustomEvent<PostView>).detail;
      if (post.visibility !== "PUBLIC") return;
      setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
    };
    window.addEventListener("post:created", onPostCreated);
    return () => window.removeEventListener("post:created", onPostCreated);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applySearch(query);
  };

  const clearSearch = () => {
    setQuery("");
    applySearch("");
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await apiClient<{ liked: boolean }>(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likedByMe: res.liked, likeCount: p.likeCount + (res.liked ? 1 : -1) }
            : p,
        ),
      );
    } catch {
      toast.error("Could not update like");
    }
  };

  const isSearching = activeQuery.length > 0;
  const noSearchResults =
    isSearching &&
    !fetching &&
    posts.length === 0 &&
    searchUsers.length === 0 &&
    searchHashtags.length === 0;

  if (initialLoading && posts.length === 0) {
    return <PageLoader label="Loading explore…" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Explore</h1>
        <p className="text-sm text-muted-foreground">
          {isSearching ? `Results for "${activeQuery}"` : "Latest public posts"}
        </p>
      </div>

      <form className="flex gap-2" onSubmit={handleSubmit}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, hashtags, posts…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#FF4458] focus:ring-2 focus:ring-[#FF4458]/30"
            maxLength={100}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={fetching}
          className="shrink-0 rounded-xl bg-gradient-to-r from-[#FF4458] to-[#FF6B35] px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {!isSearching && meta && meta.popularHashtags.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Popular hashtags</h2>
          <div className="flex flex-wrap gap-2">
            {meta.popularHashtags.map((h) => {
              const tag = `#${h.name}`;
              return (
                <button
                  key={h.name}
                  type="button"
                  onClick={() => {
                    setQuery(tag);
                    applySearch(tag);
                  }}
                  className="rounded-full bg-muted px-3 py-1 text-xs transition-colors hover:bg-muted/80"
                >
                  #{h.name} · {h.count}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {fetching && <p className="text-sm text-muted-foreground">Searching…</p>}

      {isSearching && searchUsers.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">People</h2>
          {searchUsers.map((u) => (
            <ProfileTap key={u.id} userId={u.id}>
              <div className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium">
                {u.name}
                {u.username && (
                  <span className="ml-2 text-muted-foreground">@{u.username}</span>
                )}
              </div>
            </ProfileTap>
          ))}
        </section>
      )}

      {isSearching && searchHashtags.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Hashtags</h2>
          <div className="flex flex-wrap gap-2">
            {searchHashtags.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  const tag = `#${h.name}`;
                  setQuery(tag);
                  applySearch(tag);
                }}
                className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
              >
                #{h.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {isSearching && posts.length > 0 && (
        <h2 className="text-sm font-semibold text-muted-foreground">Posts</h2>
      )}

      {noSearchResults && (
        <div className="py-12 text-center">
          <h2 className="text-lg font-semibold">No results found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different keyword, hashtag, or name.
          </p>
        </div>
      )}

      <div className={cn("grid gap-4 sm:grid-cols-2", fetching && "opacity-60")}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onLike={() => void handleLike(post.id)} />
        ))}
      </div>
      <InfiniteScrollSentinel
        onVisible={() => void loadPosts(false)}
        disabled={!hasMore || fetching}
      />
    </div>
  );
}
