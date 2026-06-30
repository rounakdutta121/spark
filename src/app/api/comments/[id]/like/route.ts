import {
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import {
  toggleCommentLike,
  CommentServiceError,
} from "@/services/social/comment.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const result = await toggleCommentLike(userId, id);
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof CommentServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to like comment", 500);
  }
}
