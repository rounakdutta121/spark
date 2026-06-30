import { errorResponse, successResponse } from "@/lib/api/response";
import { requireAdminUserId, adminErrorResponse } from "@/lib/api/require-admin";
import { adminDeletePhoto } from "@/services/admin/admin.service";
import { AdminError } from "@/services/admin/admin.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdminUserId();
    const { id } = await context.params;
    const result = await adminDeletePhoto(id);
    return successResponse(result);
  } catch (error) {
    if (error instanceof AdminError) {
      return errorResponse(error.message, error.statusCode);
    }
    try {
      return adminErrorResponse(error);
    } catch {
      return errorResponse("Failed to delete photo", 500);
    }
  }
}
