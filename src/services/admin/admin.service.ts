import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteUserAndCleanupConversations } from "@/services/chat/conversation-cleanup.service";

export class AdminError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AdminError";
  }
}

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireAdmin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });

  if (!user) {
    throw new AdminError("Unauthorized", 401);
  }

  const isAdmin =
    user.role === "ADMIN" || parseAdminEmails().has(user.email.toLowerCase());

  if (!isAdmin) {
    throw new AdminError("Forbidden", 403);
  }
}

export async function getAdminStats() {
  const [users, posts, messages, reports, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.message.count(),
      prisma.userReport.count(),
      prisma.userReport.count({ where: { status: "PENDING" } }),
    ]);

  return { users, posts, messages, reports, pendingReports };
}

export async function searchUsers(query?: string, limit = 50) {
  const q = query?.trim();
  return prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      profile: { select: { verified: true } },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 100),
  });
}

export async function setUserActive(userId: string, isActive: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, isActive: true },
  });
}

export async function setUserRole(userId: string, role: UserRole) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, role: true },
  });
}

export async function deleteUserAccount(userId: string) {
  await deleteUserAndCleanupConversations(userId);
}

export async function listReports(status?: "PENDING" | "REVIEWED" | "DISMISSED") {
  return prisma.userReport.findMany({
    where: status ? { status } : undefined,
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      reported: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function updateReportStatus(
  reportId: string,
  status: "REVIEWED" | "DISMISSED",
) {
  return prisma.userReport.update({
    where: { id: reportId },
    data: { status, reviewedAt: new Date() },
  });
}

export async function adminDeletePhoto(photoId: string) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) throw new AdminError("Photo not found", 404);
  await prisma.photo.delete({ where: { id: photoId } });
  return { deleted: true, url: photo.url };
}

export async function listRecentPosts(limit = 50) {
  return prisma.post.findMany({
    where: { status: "PUBLISHED" },
    include: {
      author: { select: { id: true, name: true, email: true } },
      _count: { select: { likes: true, comments: true } },
      media: { take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function adminDeletePost(postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AdminError("Post not found", 404);
  await prisma.post.delete({ where: { id: postId } });
  return { deleted: true };
}

export async function adminDeleteComment(commentId: string) {
  const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AdminError("Comment not found", 404);
  await prisma.postComment.delete({ where: { id: commentId } });
  return { deleted: true };
}
