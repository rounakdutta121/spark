import { prisma } from "@/lib/prisma";
import { getFollowCounts, getFollowStatus } from "@/services/social/follow.service";
import { mapUserPreview } from "@/services/social/social.mapper";
import { areUsersBlocked } from "@/services/moderation/block.service";
import type { SocialProfileView } from "@/features/social/components/social-profile-dialog";

export class PublicProfileError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = "PublicProfileError";
  }
}

export async function getPublicProfile(
  viewerId: string,
  targetUserId: string,
): Promise<SocialProfileView> {
  if (viewerId !== targetUserId && (await areUsersBlocked(viewerId, targetUserId))) {
    throw new PublicProfileError("Profile not found", 404, "NOT_FOUND");
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId, isActive: true },
    select: {
      id: true,
      name: true,
      profile: {
        select: {
          username: true,
          bio: true,
          verified: true,
          photos: { orderBy: { order: "asc" }, take: 1 },
        },
      },
      settings: { select: { isPrivateAccount: true, profileVisible: true } },
      _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
    },
  });

  if (!user?.profile) {
    throw new PublicProfileError("Profile not found", 404, "NOT_FOUND");
  }

  const isPrivate = user.settings?.isPrivateAccount ?? false;
  const follow = await getFollowStatus(viewerId, targetUserId);

  if (
    isPrivate &&
    viewerId !== targetUserId &&
    !follow.isFollowing &&
    !follow.isFollowedBy
  ) {
    throw new PublicProfileError("This account is private", 403, "FORBIDDEN");
  }

  const counts = await getFollowCounts(targetUserId);

  return {
    ...mapUserPreview({
      id: user.id,
      name: user.name,
      profile: user.profile,
    }),
    bio: user.profile.bio,
    postCount: user._count.posts,
    followers: counts.followers,
    following: counts.following,
    isFollowing: follow.isFollowing,
  };
}
