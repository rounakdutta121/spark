import { prisma } from "@/lib/prisma";
import { createNotification } from "@/services/chat/notification.service";
import { getFollowingIds } from "@/services/social/follow.service";
import { assertCanComment } from "@/services/social/permission.service";
import { mapUserPreview, userPreviewSelect } from "@/services/social/social.mapper";
import { assertStoryViewable, StoryServiceError } from "@/services/social/story.service";
import type { StoryCommentView } from "@/types/social";

export class StoryCommentServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "StoryCommentServiceError";
  }
}

function mapStoryComment(row: {
  id: string;
  text: string;
  createdAt: Date;
  author: Parameters<typeof mapUserPreview>[0];
}): StoryCommentView {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
    author: mapUserPreview(row.author),
  };
}

export async function getStoryComments(
  viewerId: string,
  storyId: string,
  cursor?: string,
  limit = 30,
): Promise<{
  comments: StoryCommentView[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  await assertStoryViewable(viewerId, storyId);

  const rows = await prisma.storyComment.findMany({
    where: {
      storyId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: { author: { select: userPreviewSelect } },
  });

  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const last = slice[slice.length - 1];

  return {
    comments: slice.map(mapStoryComment),
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
    hasMore,
  };
}

export async function createStoryComment(
  authorId: string,
  storyId: string,
  text: string,
): Promise<StoryCommentView> {
  const story = await assertStoryViewable(authorId, storyId);
  await assertCanComment(authorId, story.userId);

  const row = await prisma.storyComment.create({
    data: { storyId, authorId, text },
    include: { author: { select: userPreviewSelect } },
  });

  if (story.userId !== authorId) {
    await createNotification({
      userId: story.userId,
      type: "STORY_COMMENT",
      title: "Story comment",
      body: text.slice(0, 120),
      data: { storyId, commentId: row.id, userId: authorId },
    });
  }

  return mapStoryComment(row);
}
