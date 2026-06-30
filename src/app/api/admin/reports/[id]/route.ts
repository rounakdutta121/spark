import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { requireAdminUserId, adminErrorResponse } from "@/lib/api/require-admin";
import { adminReportStatusSchema } from "@/lib/schemas/moderation.schema";
import { updateReportStatus } from "@/services/admin/admin.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminReportStatusSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const report = await updateReportStatus(id, parsed.data.status);
    return successResponse({ report });
  } catch (error) {
    try {
      return adminErrorResponse(error);
    } catch {
      return errorResponse("Failed to update report", 500);
    }
  }
}
