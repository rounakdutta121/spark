import { prisma } from "@/lib/prisma";

import { saveStoryMedia } from "@/lib/upload/storage";

import { createNotification, createNotifications } from "@/services/chat/notification.service";

import { getBlockedAndMutedIds } from "@/services/social/social.mapper";

import { mapUserPreview, userPreviewSelect } from "@/services/social/social.mapper";

import { getFollowStatus, getFollowingIds } from "@/services/social/follow.service";
import { STORY_TTL_MS } from "@/lib/social/story-constants";
import { normalizeMediaUrl } from "@/lib/upload/media-url";
import type { StoryView } from "@/types/social";

export class StoryServiceError extends Error {

  constructor(

    message: string,

    public statusCode: number,

  ) {

    super(message);

    this.name = "StoryServiceError";

  }

}



function mapStory(

  row: {

    id: string;

    mediaUrl: string;

    mediaType: "IMAGE" | "VIDEO";

    createdAt: Date;

    expiresAt: Date;

    user: Parameters<typeof mapUserPreview>[0];

    _count: { views: number; comments: number };

  },

  seenIds: Set<string>,

): StoryView {

  return {

    id: row.id,

    mediaUrl: normalizeMediaUrl(row.mediaUrl) ?? row.mediaUrl,

    mediaType: row.mediaType,

    createdAt: row.createdAt.toISOString(),

    expiresAt: row.expiresAt.toISOString(),

    author: mapUserPreview(row.user),

    seenByMe: seenIds.has(row.id),

    viewCount: row._count.views,

    commentCount: row._count.comments,

  };

}



export async function purgeExpiredStories(): Promise<void> {

  await prisma.story.deleteMany({

    where: { expiresAt: { lte: new Date() } },

  });

}



export async function assertStoryViewable(viewerId: string, storyId: string) {

  const story = await prisma.story.findUnique({

    where: { id: storyId },

    include: { user: { include: { settings: true } } },

  });



  if (!story || story.expiresAt <= new Date()) {

    throw new StoryServiceError("Story not found", 404);

  }



  if (story.userId === viewerId) return story;



  const excluded = await getBlockedAndMutedIds(viewerId);

  if (excluded.has(story.userId)) {

    throw new StoryServiceError("Story not found", 404);

  }



  const following = await getFollowingIds(viewerId);

  if (!following.includes(story.userId)) {

    throw new StoryServiceError("Story not found", 404);

  }



  const isPrivate = story.user.settings?.isPrivateAccount ?? false;

  if (isPrivate) {

    const follow = await getFollowStatus(viewerId, story.userId);

    if (!follow.isFollowing && !follow.isFollowedBy) {

      throw new StoryServiceError("Story not found", 404);

    }

  }



  return story;

}



export async function createStory(

  userId: string,

  file: File,

): Promise<{ story: StoryView; videoTrimmed?: boolean }> {

  const { url: mediaUrl, type: mediaType, videoTrimmed } = await saveStoryMedia(file);

  const now = new Date();



  await purgeExpiredStories();



  const story = await prisma.story.create({

    data: {

      userId,

      mediaUrl,

      mediaType,

      expiresAt: new Date(now.getTime() + STORY_TTL_MS),

    },

    include: {

      user: { select: userPreviewSelect },

      _count: { select: { views: true, comments: true } },

    },

  });



  const followers = await prisma.follow.findMany({
    where: { followingId: userId, status: "ACCEPTED" },
    select: { followerId: true },
  });

  if (followers.length > 0) {
    const authorName = story.user.name;
    await createNotifications(
      followers.map((f) => ({
        userId: f.followerId,
        type: "STORY" as const,
        title: "New story",
        body: `${authorName} added a story`,
        data: { storyId: story.id, userId },
      })),
    );
  }



  return { story: mapStory(story, new Set()), videoTrimmed };
}

export async function createStoryFromMedia(
  userId: string,
  input: {
    mediaUrl: string;
    mediaType: "IMAGE" | "VIDEO";
    videoTrimmed?: boolean;
  },
): Promise<{ story: StoryView; videoTrimmed?: boolean }> {
  const now = new Date();

  await purgeExpiredStories();

  const story = await prisma.story.create({
    data: {
      userId,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      expiresAt: new Date(now.getTime() + STORY_TTL_MS),
    },
    include: {
      user: { select: userPreviewSelect },
      _count: { select: { views: true, comments: true } },
    },
  });

  const followers = await prisma.follow.findMany({
    where: { followingId: userId, status: "ACCEPTED" },
    select: { followerId: true },
  });

  if (followers.length > 0) {
    const authorName = story.user.name;
    await createNotifications(
      followers.map((f) => ({
        userId: f.followerId,
        type: "STORY" as const,
        title: "New story",
        body: `${authorName} added a story`,
        data: { storyId: story.id, userId },
      })),
    );
  }

  return {
    story: mapStory(story, new Set()),
    videoTrimmed: input.videoTrimmed,
  };
}



export async function getActiveStories(

  viewerId: string,

): Promise<StoryView[]> {

  await purgeExpiredStories();



  const excluded = await getBlockedAndMutedIds(viewerId);

  const following = await getFollowingIds(viewerId);

  const authorIds = [...new Set([viewerId, ...following])].filter(

    (id) => !excluded.has(id),

  );



  const now = new Date();

  const rows = await prisma.story.findMany({

    where: {

      userId: { in: authorIds },

      expiresAt: { gt: now },

    },

    orderBy: { createdAt: "desc" },

    include: {

      user: { select: userPreviewSelect },

      _count: { select: { views: true, comments: true } },

    },

  });



  const seen = await prisma.storyView.findMany({

    where: {

      viewerId,

      storyId: { in: rows.map((r) => r.id) },

    },

    select: { storyId: true },

  });

  const seenIds = new Set(seen.map((s) => s.storyId));



  return rows.map((r) => mapStory(r, seenIds));

}



export async function markStoryViewed(

  viewerId: string,

  storyId: string,

): Promise<void> {

  await assertStoryViewable(viewerId, storyId);



  await prisma.storyView.upsert({

    where: { storyId_viewerId: { storyId, viewerId } },

    create: { storyId, viewerId },

    update: { viewedAt: new Date() },

  });

}



export async function reactToStory(

  viewerId: string,

  storyId: string,

  emoji: string,

): Promise<void> {

  const story = await assertStoryViewable(viewerId, storyId);



  await prisma.storyReaction.create({

    data: { storyId, userId: viewerId, emoji },

  });



  if (story.userId !== viewerId) {
    await createNotification({
      userId: story.userId,
      type: "STORY_REACTION",
      title: "Story reaction",
      body: emoji,
      data: { storyId, userId: viewerId },
    });
  }
}

