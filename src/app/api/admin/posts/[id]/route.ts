import {
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { requireAdmin, adminDeletePost, AdminError } from "@/services/admin/admin.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    await requireAdmin(userId);
    const { id } = await context.params;
    const result = await adminDeletePost(id);
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof AdminError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to delete post", 500);
  }
}
