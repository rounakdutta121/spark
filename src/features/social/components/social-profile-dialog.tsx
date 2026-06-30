"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, UserMinus, MessageCircle } from "lucide-react";
import { ButtonLoader } from "@/components/shared/loading";
import { MediaImage } from "@/components/shared/media-image";
import { UserSafetyActions } from "@/components/moderation/user-safety-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTES } from "@/lib/constants";
import { apiClient } from "@/lib/api-client";
import { notifyFollowUpdated } from "@/lib/social/follow-events";
import { FollowListSheet } from "@/features/social/components/follow-list-sheet";
import type { FollowActionResult, SocialUserPreview } from "@/types/social";

export interface SocialProfileView extends SocialUserPreview {
  bio: string | null;
  postCount: number;
  followers: number;
  following: number;
  isFollowing: boolean;
}

interface SocialProfileDialogProps {
  profile: SocialProfileView | null;
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SocialProfileDialog({
  profile,
  open,
  loading,
  onOpenChange,
}: SocialProfileDialogProps) {
  const router = useRouter();
  const [followLoading, setFollowLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [followList, setFollowList] = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    if (!profile) return;
    setIsFollowing(profile.isFollowing);
    setFollowers(profile.followers);
    setFollowing(profile.following);
  }, [profile]);

  const toggleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const result: FollowActionResult = isFollowing
        ? await apiClient<FollowActionResult>(`/api/users/${profile.id}/follow`, {
            method: "DELETE",
          })
        : await apiClient<FollowActionResult>(`/api/users/${profile.id}/follow`, {
            method: "POST",
          });
      setIsFollowing(result.isFollowing);
      setFollowers(result.target.followers);
      setFollowing(result.target.following);
      notifyFollowUpdated();
      toast.success(result.isFollowing ? "Following" : "Unfollowed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setFollowLoading(false);
    }
  };

  const startMessage = async () => {
    if (!profile) return;
    setMsgLoading(true);
    try {
      const res = await apiClient<{ conversationId: string }>("/api/conversations/create", {
        method: "POST",
        body: JSON.stringify({ userId: profile.id }),
      });
      onOpenChange(false);
      router.push(ROUTES.conversation(res.conversationId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cannot message");
    } finally {
      setMsgLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : profile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative size-16 overflow-hidden rounded-full bg-muted">
                  {profile.photoUrl && (
                    <MediaImage src={profile.photoUrl} alt="" fill className="object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{profile.name}</p>
                  {profile.username && (
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  )}
                </div>
              </div>
              {profile.bio && <p className="text-sm">{profile.bio}</p>}
              <div className="flex gap-6 text-sm">
                <span><strong>{profile.postCount}</strong> posts</span>
                <button
                  type="button"
                  onClick={() => setFollowList("followers")}
                  className="hover:opacity-80"
                >
                  <strong>{followers}</strong> followers
                </button>
                <button
                  type="button"
                  onClick={() => setFollowList("following")}
                  className="hover:opacity-80"
                >
                  <strong>{following}</strong> following
                </button>
              </div>
              <div className="flex gap-2">
                <ButtonLoader
                  loading={followLoading}
                  onClick={() => void toggleFollow()}
                  className="flex-1"
                  variant={isFollowing ? "outline" : "primary"}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="size-4" /> Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4" /> Follow
                    </>
                  )}
                </ButtonLoader>
                <ButtonLoader
                  loading={msgLoading}
                  onClick={() => void startMessage()}
                  className="flex-1"
                  variant="outline"
                >
                  <MessageCircle className="size-4" /> Message
                </ButtonLoader>
                <Link
                  href={ROUTES.userProfile(profile.id)}
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 px-3 text-xs"
                  onClick={() => onOpenChange(false)}
                >
                  View
                </Link>
              </div>
              <UserSafetyActions userId={profile.id} userName={profile.name} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      {profile && (
        <FollowListSheet
          userId={profile.id}
          type={followList}
          open={followList !== null}
          onOpenChange={(next) => !next && setFollowList(null)}
        />
      )}
    </>
  );
}
