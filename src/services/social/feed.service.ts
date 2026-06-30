import { prisma } from "@/lib/prisma";
import { getFollowingIds, getSuggestedUserIds } from "@/services/social/follow.service";
import { fetchPostsByIds } from "@/services/social/post.mapper";
import { getBlockedAndMutedIds } from "@/services/social/social.mapper";
import type { FeedResponse } from "@/types/social";

export async function getHomeFeed(
  userId: string,
  cursor?: string,
  limit = 10,
): Promise<FeedResponse> {
  const excluded = await getBlockedAndMutedIds(userId);
  const following = await getFollowingIds(userId);
  const suggested = await getSuggestedUserIds(userId, 5);

  const authorIds = [...new Set([userId, ...following, ...suggested])].filter(
    (id) => !excluded.has(id),
  );

  if (authorIds.length === 0) {
    const popular = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        authorId: { notIn: Array.from(excluded) },
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      select: { id: true, createdAt: true },
    });
    const hasMore = popular.length > limit;
    const slice = popular.slice(0, limit);
    const posts = await fetchPostsByIds(userId, slice.map((p) => p.id));
    const last = slice[slice.length - 1];
    return {
      posts,
      nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
      hasMore,
    };
  }

  const rows = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      authorId: { in: authorIds },
      OR: [{ authorId: userId }, { visibility: { not: "PRIVATE" } }],
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: { id: true, createdAt: true },
  });

  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const posts = await fetchPostsByIds(userId, slice.map((r) => r.id));
  const last = slice[slice.length - 1];

  return {
    posts,
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
    hasMore,
  };
}

export async function getExploreFeed(
  userId: string,
  cursor?: string,
  limit = 12,
): Promise<FeedResponse> {
  const excluded = await getBlockedAndMutedIds(userId);

  const rows = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      authorId: { notIn: Array.from(excluded) },
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: { id: true, createdAt: true },
  });

  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const posts = await fetchPostsByIds(userId, slice.map((r) => r.id));
  const last = slice[slice.length - 1];

  return {
    posts,
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
    hasMore,
  };
}
