import { prisma } from "@/lib/prisma";
import { createNotification } from "@/services/chat/notification.service";
import { assertCanComment } from "@/services/social/permission.service";
import { mapUserPreview, userPreviewSelect } from "@/services/social/social.mapper";
import type { CommentView } from "@/types/social";

export class CommentServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "CommentServiceError";
  }
}

const commentInclude = {
  author: { select: userPreviewSelect },
  _count: { select: { likes: true } },
} as const;

type CommentRow = {
  id: string;
  text: string;
  createdAt: Date;
  parentId: string | null;
  author: Parameters<typeof mapUserPreview>[0];
  _count: { likes: number };
};

function mapComment(row: CommentRow, likedIds: Set<string>): CommentView {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
    author: mapUserPreview(row.author),
    likeCount: row._count.likes,
    likedByMe: likedIds.has(row.id),
    parentId: row.parentId,
  };
}

export async function getPostComments(
  viewerId: string,
  postId: string,
  cursor?: string,
  limit = 20,
): Promise<{ comments: CommentView[]; nextCursor: string | null; hasMore: boolean }> {
  const rows = await prisma.postComment.findMany({
    where: {
      postId,
      parentId: null,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: {
      ...commentInclude,
      replies: {
        orderBy: { createdAt: "asc" },
        include: commentInclude,
      },
    },
  });

  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const allIds = slice.flatMap((r) => [r.id, ...r.replies.map((x) => x.id)]);
  const likes = allIds.length
    ? await prisma.commentLike.findMany({
        where: { userId: viewerId, commentId: { in: allIds } },
        select: { commentId: true },
      })
    : [];
  const likedIds = new Set(likes.map((l) => l.commentId));

  const comments = slice.map((row) => ({
    ...mapComment(row, likedIds),
    replies: row.replies.map((r) => mapComment(r, likedIds)),
  }));

  const last = slice[slice.length - 1];
  return {
    comments,
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
    hasMore,
  };
}

export async function createComment(
  authorId: string,
  postId: string,
  text: string,
  parentId?: string,
): Promise<CommentView> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) throw new CommentServiceError("Post not found", 404);

  await assertCanComment(authorId, post.authorId);

  if (parentId) {
    const parent = await prisma.postComment.findUnique({
      where: { id: parentId },
      select: { postId: true },
    });
    if (!parent || parent.postId !== postId) {
      throw new CommentServiceError("Parent comment not found", 404);
    }
  }

  const row = await prisma.postComment.create({
    data: { postId, authorId, text, parentId },
    include: commentInclude,
  });

  const notifyId = parentId
    ? (
        await prisma.postComment.findUnique({
          where: { id: parentId },
          select: { authorId: true },
        })
      )?.authorId
    : post.authorId;

  if (notifyId && notifyId !== authorId) {
    await createNotification({
      userId: notifyId,
      type: parentId ? "REPLY" : "COMMENT",
      title: parentId ? "New reply" : "New comment",
      body: text.slice(0, 120),
      data: { postId, commentId: row.id, userId: authorId },
    });
  }

  return mapComment(row, new Set());
}

export async function updateComment(
  userId: string,
  commentId: string,
  text: string,
): Promise<CommentView> {
  const existing = await prisma.postComment.findUnique({
    where: { id: commentId },
    include: commentInclude,
  });
  if (!existing) throw new CommentServiceError("Comment not found", 404);
  if (existing.authorId !== userId) {
    throw new CommentServiceError("Forbidden", 403);
  }

  const row = await prisma.postComment.update({
    where: { id: commentId },
    data: { text },
    include: commentInclude,
  });
  return mapComment(row, new Set());
}

export async function deleteComment(
  userId: string,
  commentId: string,
): Promise<void> {
  const existing = await prisma.postComment.findUnique({
    where: { id: commentId },
    select: { authorId: true, post: { select: { authorId: true } } },
  });
  if (!existing) throw new CommentServiceError("Comment not found", 404);
  if (existing.authorId !== userId && existing.post.authorId !== userId) {
    throw new CommentServiceError("Forbidden", 403);
  }
  await prisma.postComment.delete({ where: { id: commentId } });
}

export async function toggleCommentLike(
  userId: string,
  commentId: string,
): Promise<{ liked: boolean }> {
  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });
  if (existing) {
    await prisma.commentLike.delete({
      where: { commentId_userId: { commentId, userId } },
    });
    return { liked: false };
  }
  await prisma.commentLike.create({ data: { commentId, userId } });
  return { liked: true };
}
