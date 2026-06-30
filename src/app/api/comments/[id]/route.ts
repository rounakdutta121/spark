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
import { updateCommentSchema } from "@/schemas/social/comment.schema";
import {
  deleteComment,
  updateComment,
  CommentServiceError,
} from "@/services/social/comment.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateCommentSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const comment = await updateComment(userId, id, parsed.data.text);
    return successResponse({ comment });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof CommentServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to update comment", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    await deleteComment(userId, id);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof CommentServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to delete comment", 500);
  }
}
