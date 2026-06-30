import type { PostVisibility, PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { areUsersBlocked } from "@/services/moderation/block.service";
import { getFollowStatus } from "@/services/social/follow.service";

export class PostAccessError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "PostAccessError";
  }
}

type PostAccessRow = {
  id: string;
  authorId: string;
  visibility: PostVisibility;
  status: PostStatus;
};

export async function canViewerSeePost(
  viewerId: string,
  post: PostAccessRow,
): Promise<boolean> {
  if (post.status !== "PUBLISHED") {
    return post.authorId === viewerId;
  }

  if (post.authorId === viewerId) return true;

  if (await areUsersBlocked(viewerId, post.authorId)) return false;

  if (post.visibility === "PRIVATE") return false;

  const follow = await getFollowStatus(viewerId, post.authorId);

  if (post.visibility === "FOLLOWERS") {
    return follow.isFollowing;
  }

  const author = await prisma.user.findUnique({
    where: { id: post.authorId, isActive: true },
    include: { settings: true },
  });
  if (!author) return false;

  const isPrivate = author.settings?.isPrivateAccount ?? false;
  if (isPrivate) {
    return follow.isFollowing || follow.isFollowedBy;
  }

  return true;
}

export async function filterVisiblePostIds(
  viewerId: string,
  postIds: string[],
): Promise<string[]> {
  if (postIds.length === 0) return [];

  const posts = await prisma.post.findMany({
    where: { id: { in: postIds }, status: "PUBLISHED" },
    select: { id: true, authorId: true, visibility: true, status: true },
  });

  const visible: string[] = [];
  for (const post of posts) {
    if (await canViewerSeePost(viewerId, post)) {
      visible.push(post.id);
    }
  }
  return visible;
}

export async function assertCanViewUserPosts(
  viewerId: string,
  authorId: string,
): Promise<void> {
  if (viewerId === authorId) return;

  if (await areUsersBlocked(viewerId, authorId)) {
    throw new PostAccessError("User not found", 404);
  }

  const user = await prisma.user.findUnique({
    where: { id: authorId, isActive: true },
    include: { settings: true },
  });
  if (!user) {
    throw new PostAccessError("User not found", 404);
  }

  const isPrivate = user.settings?.isPrivateAccount ?? false;
  if (!isPrivate) return;

  const follow = await getFollowStatus(viewerId, authorId);
  if (!follow.isFollowing && !follow.isFollowedBy) {
    throw new PostAccessError("This account is private", 403);
  }
}
