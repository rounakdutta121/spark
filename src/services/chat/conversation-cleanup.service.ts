import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

async function findOrphanedConversationIds(
  db: DbClient,
  conversationIds: string[],
): Promise<string[]> {
  const unique = [...new Set(conversationIds)];
  if (unique.length === 0) return [];

  const conversations = await db.conversation.findMany({
    where: { id: { in: unique } },
    select: { id: true, _count: { select: { participants: true } } },
  });

  return conversations
    .filter((c) => c._count.participants < 2)
    .map((c) => c.id);
}

/** Removes conversations with fewer than two participants (e.g. after the other user deleted their account). */
export async function removeOrphanedConversations(
  conversationIds: string[],
  db: DbClient = prisma,
): Promise<number> {
  const orphanIds = await findOrphanedConversationIds(db, conversationIds);
  if (orphanIds.length === 0) return 0;

  const result = await db.conversation.deleteMany({
    where: { id: { in: orphanIds } },
  });
  return result.count;
}

/** Deletes a user and removes any conversations left without a chat partner. */
export async function deleteUserAndCleanupConversations(
  userId: string,
): Promise<void> {
  const conversationIds = (
    await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    })
  ).map((p) => p.conversationId);

  await prisma.$transaction(async (tx) => {
    await tx.user.delete({ where: { id: userId } });
    await removeOrphanedConversations(conversationIds, tx);
  });
}
