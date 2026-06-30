import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchPostsByIds } from "@/services/social/post.mapper";
import {
  getBlockedAndMutedIds,
  mapUserPreview,
  userPreviewSelect,
} from "@/services/social/social.mapper";
import type { FeedResponse } from "@/types/social";

export function normalizeSearchQuery(q: string): string {
  return q.trim().replace(/^#+/, "").toLowerCase();
}

function explorePostBaseWhere(excluded: string[]): Prisma.PostWhereInput {
  return {
    status: "PUBLISHED",
    visibility: "PUBLIC",
    authorId: { notIn: excluded },
  };
}

export function buildPostSearchWhere(
  term: string,
  excluded: string[],
): Prisma.PostWhereInput {
  const base = explorePostBaseWhere(excluded);

  return {
    ...base,
    OR: [
      { caption: { contains: term, mode: "insensitive" } },
      { location: { contains: term, mode: "insensitive" } },
      {
        hashtags: {
          some: { hashtag: { name: { contains: term, mode: "insensitive" } } },
        },
      },
      { author: { name: { contains: term, mode: "insensitive" } } },
      {
        author: {
          profile: { username: { contains: term, mode: "insensitive" } },
        },
      },
    ],
  };
}

export async function searchExplorePosts(
  userId: string,
  q: string,
  cursor?: string,
  limit = 12,
): Promise<FeedResponse> {
  const term = normalizeSearchQuery(q);
  if (!term) {
    return { posts: [], nextCursor: null, hasMore: false };
  }

  const excluded = await getBlockedAndMutedIds(userId);

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

  const rows = await prisma.post.findMany({
    where: buildPostSearchWhere(term, Array.from(excluded)),
    select: { id: true },
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
    skip: safeOffset,
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const posts = await fetchPostsByIds(
    userId,
    slice.map((r) => r.id),
  );

  return {
    posts,
    nextCursor: hasMore ? String(safeOffset + limit) : null,
    hasMore,
  };
}

export async function searchUsers(
  userId: string,
  q: string,
  limit = 20,
) {
  const term = normalizeSearchQuery(q);
  if (!term) return [];

  const excluded = await getBlockedAndMutedIds(userId);
  excluded.add(userId);

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      id: { notIn: Array.from(excluded) },
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { profile: { username: { contains: term, mode: "insensitive" } } },
      ],
    },
    select: userPreviewSelect,
    take: limit,
    orderBy: { lastActiveAt: "desc" },
  });

  return users.map((u) => mapUserPreview(u));
}

export async function searchHashtags(q: string, limit = 20) {
  const term = normalizeSearchQuery(q);
  if (!term) return [];

  return prisma.hashtag.findMany({
    where: { name: { contains: term, mode: "insensitive" } },
    take: limit,
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function searchPosts(
  userId: string,
  q: string,
  limit = 20,
) {
  const term = normalizeSearchQuery(q);
  if (!term) return [];

  const excluded = await getBlockedAndMutedIds(userId);

  const rows = await prisma.post.findMany({
    where: buildPostSearchWhere(term, Array.from(excluded)),
    select: { id: true },
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
    take: limit,
  });

  return fetchPostsByIds(
    userId,
    rows.map((r) => r.id),
  );
}
