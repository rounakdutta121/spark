import { prisma } from "@/lib/prisma";

export async function muteUser(muterId: string, mutedId: string): Promise<void> {
  if (muterId === mutedId) return;
  await prisma.userMute.upsert({
    where: { muterId_mutedId: { muterId, mutedId } },
    create: { muterId, mutedId },
    update: {},
  });
}

export async function unmuteUser(muterId: string, mutedId: string): Promise<void> {
  await prisma.userMute.deleteMany({ where: { muterId, mutedId } });
}

export async function listMutedUsers(muterId: string) {
  const rows = await prisma.userMute.findMany({
    where: { muterId },
    include: {
      muted: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    userId: r.muted.id,
    name: r.muted.name,
    mutedAt: r.createdAt.toISOString(),
  }));
}
