"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Share2, UserPlus, UserMinus, MessageCircle, Pencil } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { MediaDisplay } from "@/components/shared/media-image";
import { ButtonLoader } from "@/components/shared/loading";
import { PageLoader } from "@/components/shared/loading";
import { InfiniteScrollSentinel } from "@/components/layout/main-shell";
import { ROUTES } from "@/lib/constants";
import { apiClient } from "@/lib/api-client";
import { FOLLOW_UPDATED_EVENT, notifyFollowUpdated } from "@/lib/social/follow-events";
import type { FollowActionResult, PostView } from "@/types/social";
import type { SocialProfileView } from "@/features/social/components/social-profile-dialog";
import { ButtonLink } from "@/components/shared/button-link";
import { FollowListSheet } from "@/features/social/components/follow-list-sheet";
import { PostProfileViewer } from "@/features/social/components/post-profile-viewer";

interface SocialProfilePageProps {
  userId: string;
  isOwn?: boolean;
}

function mergePosts(prev: PostView[], next: PostView[], reset: boolean): PostView[] {
  if (reset) return next;
  const seen = new Set(prev.map((p) => p.id));
  return [...prev, ...next.filter((p) => !seen.has(p.id))];
}

export function SocialProfilePage({ userId, isOwn }: SocialProfilePageProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<SocialProfileView | null>(null);
  const [posts, setPosts] = useState<PostView[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const [followList, setFollowList] = useState<"followers" | "following" | null>(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const postsLoadingRef = useRef(false);

  const loadProfile = useCallback(async () => {
    const data = await apiClient<{ profile: SocialProfileView }>(
      `/api/users/${userId}/profile`,
    );
    setProfile(data.profile);
  }, [userId]);

  const loadPosts = useCallback(
    async (reset = false) => {
      if (!reset && !hasMoreRef.current) return;
      if (postsLoadingRef.current) return;

      postsLoadingRef.current = true;
      if (reset) {
        cursorRef.current = null;
        hasMoreRef.current = true;
        setLoadingMore(false);
      } else {
        setLoadingMore(true);
      }

      try {
        const endpoint =
          isOwn && tab === "saved" ? "/api/posts/saved" : `/api/users/${userId}/posts`;
        const params = new URLSearchParams();
        if (!reset && cursorRef.current) params.set("cursor", cursorRef.current);
        const data = await apiClient<{
          posts: PostView[];
          nextCursor: string | null;
          hasMore: boolean;
        }>(`${endpoint}${params.toString() ? `?${params}` : ""}`);
        setPosts((prev) => mergePosts(prev, data.posts, reset));
        cursorRef.current = data.nextCursor;
        hasMoreRef.current = data.hasMore;
        setHasMore(data.hasMore);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load posts");
      } finally {
        postsLoadingRef.current = false;
        setLoadingMore(false);
      }
    },
    [isOwn, tab, userId],
  );

  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    cursorRef.current = null;
    hasMoreRef.current = true;
    postsLoadingRef.current = false;
    setLoading(true);
    Promise.all([loadProfile(), loadPosts(true)])
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [loadProfile, loadPosts, userId, tab]);

  useEffect(() => {
    const refreshCounts = () => void loadProfile();
    window.addEventListener(FOLLOW_UPDATED_EVENT, refreshCounts);
    return () => window.removeEventListener(FOLLOW_UPDATED_EVENT, refreshCounts);
  }, [loadProfile]);

  const applyFollowResult = (result: FollowActionResult, targetUserId: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      if (prev.id === targetUserId) {
        return {
          ...prev,
          followers: result.target.followers,
          following: result.target.following,
          isFollowing: result.isFollowing,
        };
      }
      if (isOwn) {
        return { ...prev, following: result.viewer.following };
      }
      return prev;
    });
    notifyFollowUpdated();
  };

  const toggleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const result = profile.isFollowing
        ? await apiClient<FollowActionResult>(`/api/users/${profile.id}/follow`, {
            method: "DELETE",
          })
        : await apiClient<FollowActionResult>(`/api/users/${profile.id}/follow`, {
            method: "POST",
          });
      applyFollowResult(result, profile.id);
      toast.success(result.isFollowing ? "Following" : "Unfollowed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setFollowLoading(false);
    }
  };

  const startMessage = async () => {
    try {
      const res = await apiClient<{ conversationId: string }>("/api/conversations/create", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      router.push(ROUTES.conversation(res.conversationId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cannot message");
    }
  };

  const shareProfile = async () => {
    const url = `${window.location.origin}${ROUTES.userProfile(userId)}`;
    if (navigator.share) {
      await navigator.share({ title: profile?.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    }
  };

  if (loading && !profile) {
    return <PageLoader label="Loading profile…" />;
  }

  if (!profile) {
    return <p className="py-8 text-center text-destructive">Profile not found</p>;
  }

  return (
    <div className="space-y-6">
      <GlassCard className="space-y-4 p-4">
        <div className="flex items-start gap-4">
          <div className="relative size-20 overflow-hidden rounded-full bg-muted">
            {profile.photoUrl && (
              <MediaDisplay src={profile.photoUrl} alt="" fill className="object-cover" />
            )}
          </div>
          <div className="flex flex-1 justify-around text-center text-sm">
            <div>
              <p className="font-bold">{profile.postCount}</p>
              <p className="text-muted-foreground">Posts</p>
            </div>
            <button
              type="button"
              onClick={() => setFollowList("followers")}
              className="transition-opacity hover:opacity-80"
            >
              <p className="font-bold">{profile.followers}</p>
              <p className="text-muted-foreground">Followers</p>
            </button>
            <button
              type="button"
              onClick={() => setFollowList("following")}
              className="transition-opacity hover:opacity-80"
            >
              <p className="font-bold">{profile.following}</p>
              <p className="text-muted-foreground">Following</p>
            </button>
          </div>
        </div>
        <div>
          <p className="font-semibold">{profile.name}</p>
          {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
          {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
        </div>
        <div className="flex gap-2">
          {isOwn ? (
            <ButtonLink href={ROUTES.editProfile} className="flex-1 rounded-full">
              <Pencil className="size-4" /> Edit profile
            </ButtonLink>
          ) : (
            <ButtonLoader
              loading={followLoading}
              onClick={() => void toggleFollow()}
              className="flex-1 rounded-full"
              variant={profile.isFollowing ? "outline" : "primary"}
            >
              {profile.isFollowing ? <><UserMinus className="size-4" /> Unfollow</> : <><UserPlus className="size-4" /> Follow</>}
            </ButtonLoader>
          )}
          {!isOwn && (
            <button
              type="button"
              onClick={() => void startMessage()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 px-4 text-sm"
            >
              <MessageCircle className="size-4" /> Message
            </button>
          )}
          <button type="button" onClick={() => void shareProfile()} className="rounded-full border border-white/20 p-2">
            <Share2 className="size-4" />
          </button>
        </div>
      </GlassCard>

      {isOwn && (
        <div className="flex gap-2 border-b border-white/10">
          {(["posts", "saved"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm capitalize ${tab === t ? "border-b-2 border-[#FF4458] font-semibold" : "text-muted-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {tab === "posts" && posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No posts yet</p>
      ) : tab === "saved" && posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No saved posts</p>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((p, i) => (
            <GridThumb key={p.id} post={p} onClick={() => setSelectedPostIndex(i)} />
          ))}
        </div>
      )}

      <InfiniteScrollSentinel
        onVisible={() => void loadPosts(false)}
        disabled={!hasMore || loadingMore || loading}
      />

      <FollowListSheet
        userId={userId}
        type={followList}
        open={followList !== null}
        onOpenChange={(open) => !open && setFollowList(null)}
      />

      <PostProfileViewer
        posts={posts}
        index={selectedPostIndex}
        onIndexChange={setSelectedPostIndex}
        onPostsChange={setPosts}
      />
    </div>
  );
}

function GridThumb({ post, onClick }: { post: PostView; onClick: () => void }) {
  const thumb = post.media[0];
  if (!thumb) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square bg-muted"
    >
      <MediaDisplay
        src={thumb.url}
        alt=""
        type={thumb.type}
        fill
        className="object-cover"
        sizes="33vw"
        loading="lazy"
        showVideoControls={false}
        showVideoBadge={thumb.type === "VIDEO"}
      />
      <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20 group-active:bg-black/30" />
      {post.media.length > 1 && (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-sm border border-white bg-white/80 shadow" />
      )}
    </button>
  );
}
