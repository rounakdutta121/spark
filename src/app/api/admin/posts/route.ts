import {
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { requireAdmin, listRecentPosts, AdminError } from "@/services/admin/admin.service";

export async function GET() {
  try {
    const userId = await requireUserId();
    await requireAdmin(userId);
    const posts = await listRecentPosts();
    return successResponse({ posts });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof AdminError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to load posts", 500);
  }
}
