import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { deleteUserAndCleanupConversations } from "@/services/chat/conversation-cleanup.service";

export class AccountServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = "AccountServiceError";
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AccountServiceError("User not found", 404);

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    throw new AccountServiceError("Current password is incorrect", 400);
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
}

export async function logoutAllDevices(userId: string): Promise<void> {
  const sessions = await prisma.session.findMany({
    where: { userId },
    select: { id: true },
  });

  if (sessions.length === 0) return;

  const sessionIds = sessions.map((s) => s.id);

  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { sessionId: { in: sessionIds }, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);
}

export async function deleteAccount(userId: string): Promise<void> {
  await deleteUserAndCleanupConversations(userId);
}

export async function updateNotificationSettings(
  userId: string,
  input: {
    pushNotifications?: boolean;
    emailNotifications?: boolean;
    profileVisible?: boolean;
    showDistance?: boolean;
    showAge?: boolean;
    isPrivateAccount?: boolean;
    messagePermission?: "EVERYONE" | "FOLLOWERS" | "NONE";
    mentionPermission?: "EVERYONE" | "FOLLOWERS" | "NONE";
    tagPermission?: "EVERYONE" | "FOLLOWERS" | "NONE";
    commentPermission?: "EVERYONE" | "FOLLOWERS" | "NONE";
  },
) {
  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
}
