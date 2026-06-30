import { prisma } from "@/lib/prisma";

export async function areUsersBlocked(
  userId: string,
  otherUserId: string,
): Promise<boolean> {
  if (userId === otherUserId) return false;

  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId },
      ],
    },
  });

  return !!block;
}

export async function getBlockedUserIds(userId: string): Promise<Set<string>> {
  const blocks = await prisma.userBlock.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: { blockerId: true, blockedId: true },
  });

  const ids = new Set<string>();
  for (const b of blocks) {
    ids.add(b.blockerId === userId ? b.blockedId : b.blockerId);
  }
  return ids;
}

export class BlockServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = "BlockServiceError";
  }
}

export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  if (blockerId === blockedId) {
    throw new BlockServiceError("Cannot block yourself", 400);
  }

  const target = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) {
    throw new BlockServiceError("User not found", 404);
  }

  await prisma.userBlock.upsert({
    where: {
      blockerId_blockedId: { blockerId, blockedId },
    },
    create: { blockerId, blockedId },
    update: {},
  });
}

export async function unblockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  await prisma.userBlock.deleteMany({
    where: { blockerId, blockedId },
  });
}

export async function listBlockedUsers(blockerId: string) {
  const blocks = await prisma.userBlock.findMany({
    where: { blockerId },
    orderBy: { createdAt: "desc" },
  });

  if (blocks.length === 0) return [];

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: blocks.map((b) => b.blockedId) } },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      user: { select: { id: true, name: true } },
    },
  });

  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  return blocks.map((b) => {
    const profile = profileMap.get(b.blockedId);
    const photo = profile?.photos[0];
    return {
      userId: b.blockedId,
      name: profile?.user.name ?? "User",
      photoUrl: photo?.url ?? null,
      blockedAt: b.createdAt.toISOString(),
    };
  });
}
