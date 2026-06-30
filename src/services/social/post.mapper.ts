import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractHashtags } from "@/services/social/hashtag.util";
import { mapUserPreview, userPreviewSelect } from "@/services/social/social.mapper";
import { filterVisiblePostIds } from "@/services/social/post-visibility.service";
import { normalizeMediaUrl } from "@/lib/upload/media-url";
import type { PostView } from "@/types/social";

const postInclude = {
  author: { select: userPreviewSelect },
  media: { orderBy: { order: "asc" as const } },
  hashtags: { include: { hashtag: true } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostInclude;

export { postInclude };

type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export function mapPost(
  post: PostRow,
  viewerId: string,
  likedIds: Set<string>,
  savedIds: Set<string>,
): PostView {
  return {
    id: post.id,
    caption: post.caption,
    location: post.location,
    visibility: post.visibility,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    author: mapUserPreview(post.author),
    media: post.media.map((m) => ({
      id: m.id,
      url: normalizeMediaUrl(m.url) ?? m.url,
      type: m.type,
      order: m.order,
      altText: m.altText,
    })),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: likedIds.has(post.id),
    savedByMe: savedIds.has(post.id),
    hashtags: post.hashtags.map((h) => h.hashtag.name),
  };
}

export async function getViewerPostMeta(
  viewerId: string,
  postIds: string[],
): Promise<{ likedIds: Set<string>; savedIds: Set<string> }> {
  if (postIds.length === 0) {
    return { likedIds: new Set(), savedIds: new Set() };
  }
  const [likes, saves] = await Promise.all([
    prisma.postLike.findMany({
      where: { userId: viewerId, postId: { in: postIds } },
      select: { postId: true },
    }),
    prisma.savedPost.findMany({
      where: { userId: viewerId, postId: { in: postIds } },
      select: { postId: true },
    }),
  ]);
  return {
    likedIds: new Set(likes.map((l) => l.postId)),
    savedIds: new Set(saves.map((s) => s.postId)),
  };
}

export async function syncPostHashtags(
  postId: string,
  caption: string | null | undefined,
): Promise<void> {
  await prisma.postHashtag.deleteMany({ where: { postId } });
  const tags = extractHashtags(caption);
  if (tags.length === 0) return;

  for (const name of tags) {
    const hashtag = await prisma.hashtag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    await prisma.postHashtag.create({
      data: { postId, hashtagId: hashtag.id },
    });
  }
}

export async function fetchPostsByIds(
  viewerId: string,
  ids: string[],
): Promise<PostView[]> {
  if (ids.length === 0) return [];
  const visibleIds = await filterVisiblePostIds(viewerId, ids);
  if (visibleIds.length === 0) return [];

  const posts = await prisma.post.findMany({
    where: { id: { in: visibleIds }, status: "PUBLISHED" },
    include: postInclude,
    orderBy: { createdAt: "desc" },
  });
  const meta = await getViewerPostMeta(viewerId, posts.map((p) => p.id));
  const order = new Map(ids.map((id, i) => [id, i]));
  return posts
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((p) => mapPost(p, viewerId, meta.likedIds, meta.savedIds));
}
