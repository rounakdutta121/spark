import {
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import {
  requireVerifiedUserId,
  unauthorizedResponse,
  UnauthorizedError,
  writeAccessErrorResponse,
} from "@/lib/api/require-auth";
import {
  toggleSavePost,
  PostServiceError,
} from "@/services/social/post.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const userId = await requireVerifiedUserId();
    const { id } = await context.params;
    const result = await toggleSavePost(userId, id);
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const writeErr = writeAccessErrorResponse(error);
    if (writeErr) return writeErr;
    if (error instanceof PostServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to save post", 500);
  }
}
