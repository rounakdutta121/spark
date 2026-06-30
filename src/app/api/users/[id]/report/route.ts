import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { logger } from "@/lib/logger";
import { reportUserSchema } from "@/lib/schemas/moderation.schema";
import {
  createReport,
  ReportServiceError,
} from "@/services/moderation/report.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const rate = await checkRateLimit(`report:${userId}`, 10, 24 * 60 * 60 * 1000);
    if (!rate.allowed) {
      return errorResponse("Too many reports. Try again later.", 429);
    }

    const { id: reportedUserId } = await context.params;
    const body = await request.json();
    const parsed = reportUserSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const report = await createReport(
      userId,
      reportedUserId,
      parsed.data.reason,
      parsed.data.details,
    );

    logger.report("User reported", {
      reportId: report.id,
      reporterId: userId,
      reportedUserId,
      reason: parsed.data.reason,
    });

    return successResponse({ reportId: report.id }, 201);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof ReportServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    logger.error("Report user error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return errorResponse("Failed to submit report", 500);
  }
}
