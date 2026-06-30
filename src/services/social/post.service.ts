import { prisma } from "@/lib/prisma";
import { savePostMedia } from "@/lib/upload/storage";
import { syncPostHashtags, fetchPostsByIds, mapPost, postInclude } from "@/services/social/post.mapper";
import { assertCanViewUserPosts } from "@/services/social/post-visibility.service";
import type { PostView } from "@/types/social";
import type { CreatePostInput } from "@/schemas/social/post.schema";

export class PostServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = "PostServiceError";
  }
}

export async function createPost(
  authorId: string,
  input: CreatePostInput,
  files: File[],
): Promise<PostView> {
  const mediaUrls: { url: string; type: "IMAGE" | "VIDEO"; order: number; altText?: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const saved = await savePostMedia(file);
    mediaUrls.push({
      url: saved.url,
      type: saved.type,
      order: i,
      altText: input.altTexts?.[i],
    });
  }

  return createPostWithMedia(authorId, input, mediaUrls);
}

export async function createPostWithMedia(
  authorId: string,
  input: CreatePostInput,
  media: { url: string; type: "IMAGE" | "VIDEO"; order: number; altText?: string }[],
): Promise<PostView> {
  const post = await prisma.post.create({
    data: {
      authorId,
      caption: input.caption,
      location: input.location,
      visibility: input.visibility ?? "PUBLIC",
      status: input.status ?? "PUBLISHED",
      media: {
        create: media.map((m) => ({
          url: m.url,
          type: m.type,
          order: m.order,
          altText: m.altText,
        })),
      },
    },
    include: postInclude,
  });

  await syncPostHashtags(post.id, input.caption);

  return mapPost(post, authorId, new Set(), new Set());
}

export async function togglePostLike(
  userId: string,
  postId: string,
): Promise<{ liked: boolean }> {
  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) {
    await prisma.postLike.delete({ where: { postId_userId: { postId, userId } } });
    return { liked: false };
  }
  await prisma.postLike.create({ data: { postId, userId } });
  return { liked: true };
}

export async function toggleSavePost(
  userId: string,
  postId: string,
): Promise<{ saved: boolean }> {
  const existing = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existing) {
    await prisma.savedPost.delete({ where: { userId_postId: { userId, postId } } });
    return { saved: false };
  }
  await prisma.savedPost.create({ data: { userId, postId } });
  return { saved: true };
}

export async function deletePost(userId: string, postId: string): Promise<void> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new PostServiceError("Post not found", 404);
  if (post.authorId !== userId) throw new PostServiceError("Forbidden", 403);
  await prisma.post.delete({ where: { id: postId } });
}

export async function getPostById(
  viewerId: string,
  postId: string,
): Promise<PostView | null> {
  const posts = await fetchPostsByIds(viewerId, [postId]);
  return posts[0] ?? null;
}

export async function getUserPosts(
  viewerId: string,
  authorId: string,
  cursor?: string,
  limit = 12,
): Promise<{ posts: PostView[]; nextCursor: string | null; hasMore: boolean }> {
  await assertCanViewUserPosts(viewerId, authorId);

  const rows = await prisma.post.findMany({
    where: {
      authorId,
      status: "PUBLISHED",
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: { id: true, createdAt: true },
  });

  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const posts = await fetchPostsByIds(viewerId, slice.map((r) => r.id));
  const last = slice[slice.length - 1];

  return {
    posts,
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
    hasMore,
  };
}

export async function getSavedPosts(
  userId: string,
  cursor?: string,
  limit = 12,
): Promise<{ posts: PostView[]; nextCursor: string | null; hasMore: boolean }> {
  const saves = await prisma.savedPost.findMany({
    where: {
      userId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = saves.length > limit;
  const slice = saves.slice(0, limit);
  const posts = await fetchPostsByIds(userId, slice.map((s) => s.postId));
  const last = slice[slice.length - 1];

  return {
    posts,
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
    hasMore,
  };
}
