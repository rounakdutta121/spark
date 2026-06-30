import { prisma } from "@/lib/prisma";
import type { PermissionLevel } from "@prisma/client";
import { getFollowStatus } from "@/services/social/follow.service";

export class SocialPermissionError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "SocialPermissionError";
  }
}

async function checkPermission(
  actorId: string,
  targetId: string,
  level: PermissionLevel,
): Promise<boolean> {
  if (actorId === targetId) return true;
  if (level === "EVERYONE") return true;
  if (level === "NONE") return false;
  const follow = await getFollowStatus(actorId, targetId);
  return follow.isFollowing;
}

export async function assertCanComment(
  actorId: string,
  postAuthorId: string,
): Promise<void> {
  const author = await prisma.user.findUnique({
    where: { id: postAuthorId },
    include: { settings: true },
  });
  const level = author?.settings?.commentPermission ?? "EVERYONE";
  const allowed = await checkPermission(actorId, postAuthorId, level);
  if (!allowed) {
    throw new SocialPermissionError("Comments are not allowed", 403);
  }
}
