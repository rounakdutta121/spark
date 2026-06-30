import { prisma } from "@/lib/prisma";
import { normalizeMediaUrl } from "@/lib/upload/media-url";
import type { SocialUserPreview } from "@/types/social";

export function mapUserPreview(user: {
  id: string;
  name: string;
  profile: {
    username: string | null;
    verified: boolean;
    photos: { url: string; isPrimary: boolean; order: number }[];
  } | null;
}): SocialUserPreview {
  const photos = user.profile?.photos ?? [];
  const primary =
    photos.find((p) => p.isPrimary) ?? photos.sort((a, b) => a.order - b.order)[0];
  return {
    id: user.id,
    name: user.name,
    username: user.profile?.username ?? null,
    photoUrl: normalizeMediaUrl(primary?.url ?? null),
    verified: user.profile?.verified ?? false,
  };
}

export const userPreviewSelect = {
  id: true,
  name: true,
  profile: {
    select: {
      username: true,
      verified: true,
      photos: { orderBy: { order: "asc" as const }, take: 1 },
    },
  },
} as const;

export async function getBlockedAndMutedIds(userId: string): Promise<Set<string>> {
  const [blocks, mutes] = await Promise.all([
    prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    }),
    prisma.userMute.findMany({
      where: { muterId: userId },
      select: { mutedId: true },
    }),
  ]);
  const ids = new Set<string>();
  for (const b of blocks) {
    ids.add(b.blockerId === userId ? b.blockedId : b.blockerId);
  }
  for (const m of mutes) ids.add(m.mutedId);
  return ids;
}
