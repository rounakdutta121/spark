import { prisma } from "@/lib/prisma";
import { getBlockedAndMutedIds } from "@/services/social/social.mapper";
import { mapUserPreview, userPreviewSelect } from "@/services/social/social.mapper";
import type { ExploreMeta } from "@/types/social";

export async function getExploreMeta(userId: string): Promise<ExploreMeta> {
  const excluded = await getBlockedAndMutedIds(userId);
  excluded.add(userId);

  const [hashtags, suggestions] = await Promise.all([
    prisma.postHashtag.groupBy({
      by: ["hashtagId"],
      _count: { postId: true },
      orderBy: { _count: { postId: "desc" } },
      take: 10,
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        id: { notIn: Array.from(excluded) },
        posts: { some: { status: "PUBLISHED" } },
      },
      select: userPreviewSelect,
      orderBy: { lastActiveAt: "desc" },
      take: 6,
    }),
  ]);

  const hashtagIds = hashtags.map((h) => h.hashtagId);
  const tagRows = hashtagIds.length
    ? await prisma.hashtag.findMany({ where: { id: { in: hashtagIds } } })
    : [];
  const tagMap = new Map(tagRows.map((t) => [t.id, t.name]));

  return {
    popularHashtags: hashtags
      .map((h) => ({
        name: tagMap.get(h.hashtagId) ?? "",
        count: h._count.postId,
      }))
      .filter((h) => h.name),
    suggestedAccounts: suggestions.map(mapUserPreview),
  };
}
