import { prisma } from "@/lib/prisma";
import { getBlockedAndMutedIds, mapUserPreview, userPreviewSelect } from "@/services/social/social.mapper";
import type { FollowActionResult, FollowCounts, FollowListResponse, FollowStatusView, FollowUserView } from "@/types/social";

export class FollowServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = "FollowServiceError";
  }
}

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const [followers, following] = await Promise.all([
    prisma.follow.count({
      where: { followingId: userId, status: "ACCEPTED" },
    }),
    prisma.follow.count({
      where: { followerId: userId, status: "ACCEPTED" },
    }),
  ]);
  return { followers, following };
}

export async function getFollowStatus(
  viewerId: string,
  targetId: string,
): Promise<FollowStatusView> {
  if (viewerId === targetId) {
    return { status: null, isFollowing: false, isFollowedBy: false, mutualCount: 0 };
  }

  const [outgoing, incoming, mutualCount] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
    }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: targetId, followingId: viewerId } },
    }),
    prisma.follow.count({
      where: {
        followerId: { in: [viewerId, targetId] },
        followingId: { in: [viewerId, targetId] },
        status: "ACCEPTED",
      },
    }),
  ]);

  return {
    status: outgoing?.status ?? null,
    isFollowing: outgoing?.status === "ACCEPTED",
    isFollowedBy: incoming?.status === "ACCEPTED",
    mutualCount: Math.max(0, mutualCount - (outgoing ? 1 : 0) - (incoming ? 1 : 0)),
  };
}

export async function followUser(
  followerId: string,
  followingId: string,
): Promise<FollowActionResult> {
  if (followerId === followingId) {
    throw new FollowServiceError("Cannot follow yourself", 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: followingId },
    include: { settings: true },
  });
  if (!target?.isActive) {
    throw new FollowServiceError("User not found", 404);
  }

  const blocked = await getBlockedAndMutedIds(followerId);
  if (blocked.has(followingId)) {
    throw new FollowServiceError("User not found", 404);
  }

  const isPrivate = target.settings?.isPrivateAccount ?? false;
  const status = isPrivate ? "PENDING" : "ACCEPTED";

  await prisma.follow.upsert({
    where: {
      followerId_followingId: { followerId, followingId },
    },
    create: { followerId, followingId, status },
    update: { status },
  });

  const [targetCounts, viewerCounts] = await Promise.all([
    getFollowCounts(followingId),
    getFollowCounts(followerId),
  ]);

  return {
    status,
    isFollowing: status === "ACCEPTED",
    target: targetCounts,
    viewer: viewerCounts,
  };
}

export async function unfollowUser(
  followerId: string,
  followingId: string,
): Promise<FollowActionResult> {
  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });

  const [targetCounts, viewerCounts] = await Promise.all([
    getFollowCounts(followingId),
    getFollowCounts(followerId),
  ]);

  return {
    status: null,
    isFollowing: false,
    target: targetCounts,
    viewer: viewerCounts,
  };
}

export async function acceptFollowRequest(
  userId: string,
  followerId: string,
): Promise<FollowActionResult> {
  const row = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId: userId },
    },
  });
  if (!row || row.status !== "PENDING") {
    throw new FollowServiceError("Request not found", 404);
  }
  await prisma.follow.update({
    where: { id: row.id },
    data: { status: "ACCEPTED" },
  });

  const [targetCounts, viewerCounts] = await Promise.all([
    getFollowCounts(userId),
    getFollowCounts(followerId),
  ]);

  return {
    status: "ACCEPTED",
    isFollowing: true,
    target: targetCounts,
    viewer: viewerCounts,
  };
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId, status: "ACCEPTED" },
    select: { followingId: true },
  });
  return rows.map((r) => r.followingId);
}

export async function getSuggestedUserIds(
  userId: string,
  limit = 10,
): Promise<string[]> {
  const excluded = await getBlockedAndMutedIds(userId);
  excluded.add(userId);

  const following = await getFollowingIds(userId);
  following.forEach((id) => excluded.add(id));

  const suggestions = await prisma.follow.findMany({
    where: {
      followerId: { in: following },
      followingId: { notIn: Array.from(excluded) },
      status: "ACCEPTED",
    },
    select: { followingId: true },
    take: limit * 3,
  });

  const counts = new Map<string, number>();
  for (const s of suggestions) {
    counts.set(s.followingId, (counts.get(s.followingId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

async function assertCanViewFollowList(
  viewerId: string,
  targetUserId: string,
): Promise<void> {
  if (viewerId === targetUserId) return;

  const user = await prisma.user.findUnique({
    where: { id: targetUserId, isActive: true },
    include: { settings: true },
  });
  if (!user) throw new FollowServiceError("User not found", 404);

  const blocked = await getBlockedAndMutedIds(viewerId);
  if (blocked.has(targetUserId)) {
    throw new FollowServiceError("User not found", 404);
  }

  const isPrivate = user.settings?.isPrivateAccount ?? false;
  if (!isPrivate) return;

  const follow = await getFollowStatus(viewerId, targetUserId);
  if (!follow.isFollowing && !follow.isFollowedBy) {
    throw new FollowServiceError("This account is private", 403);
  }
}

async function mapFollowUsers(
  viewerId: string,
  userIds: string[],
): Promise<FollowUserView[]> {
  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, isActive: true },
    select: userPreviewSelect,
  });
  const order = new Map(userIds.map((id, i) => [id, i]));

  const outgoing = await prisma.follow.findMany({
    where: { followerId: viewerId, followingId: { in: userIds }, status: "ACCEPTED" },
    select: { followingId: true },
  });
  const followingSet = new Set(outgoing.map((r) => r.followingId));

  return users
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((u) => ({
      ...mapUserPreview(u),
      isFollowing: followingSet.has(u.id),
    }));
}

export async function listFollowers(
  viewerId: string,
  userId: string,
  cursor?: string,
  limit = 30,
): Promise<FollowListResponse> {
  await assertCanViewFollowList(viewerId, userId);
  const excluded = await getBlockedAndMutedIds(viewerId);
  excluded.add(userId);

  const rows = await prisma.follow.findMany({
    where: {
      followingId: userId,
      status: "ACCEPTED",
      followerId: { notIn: Array.from(excluded) },
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: { followerId: true, createdAt: true },
  });

  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const users = await mapFollowUsers(viewerId, slice.map((r) => r.followerId));
  const last = slice[slice.length - 1];

  return {
    users,
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
    hasMore,
  };
}

export async function listFollowing(
  viewerId: string,
  userId: string,
  cursor?: string,
  limit = 30,
): Promise<FollowListResponse> {
  await assertCanViewFollowList(viewerId, userId);
  const excluded = await getBlockedAndMutedIds(viewerId);
  excluded.add(userId);

  const rows = await prisma.follow.findMany({
    where: {
      followerId: userId,
      status: "ACCEPTED",
      followingId: { notIn: Array.from(excluded) },
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: { followingId: true, createdAt: true },
  });

  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const users = await mapFollowUsers(viewerId, slice.map((r) => r.followingId));
  const last = slice[slice.length - 1];

  return {
    users,
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
    hasMore,
  };
}
