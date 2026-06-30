import type { ReportReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { areUsersBlocked } from "@/services/moderation/block.service";

export class ReportServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ReportServiceError";
  }
}

const MAX_DETAILS = 1000;

export async function createReport(
  reporterId: string,
  reportedUserId: string,
  reason: ReportReason,
  details?: string,
) {
  if (reporterId === reportedUserId) {
    throw new ReportServiceError("Cannot report yourself", 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: reportedUserId },
  });
  if (!target) {
    throw new ReportServiceError("User not found", 404);
  }

  if (await areUsersBlocked(reporterId, reportedUserId)) {
    throw new ReportServiceError("User not found", 404);
  }

  const trimmed = details?.trim().slice(0, MAX_DETAILS);

  const recent = await prisma.userReport.findFirst({
    where: {
      reporterId,
      reportedUserId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  if (recent) {
    throw new ReportServiceError(
      "You already reported this user recently",
      429,
      "RATE_LIMITED",
    );
  }

  return prisma.userReport.create({
    data: {
      reporterId,
      reportedUserId,
      reason,
      details: trimmed || null,
    },
  });
}
