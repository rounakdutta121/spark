import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  requireVerifiedUserId,
  unauthorizedResponse,
  UnauthorizedError,
  writeAccessErrorResponse,
} from "@/lib/api/require-auth";
import {
  commentQuerySchema,
  createCommentSchema,
} from "@/schemas/social/comment.schema";
import {
  createComment,
  getPostComments,
  CommentServiceError,
} from "@/services/social/comment.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const parsed = commentQuerySchema.safeParse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const result = await getPostComments(
      userId,
      id,
      parsed.data.cursor,
      parsed.data.limit,
    );
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to load comments", 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await requireVerifiedUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const comment = await createComment(
      userId,
      id,
      parsed.data.text,
      parsed.data.parentId,
    );
    return successResponse({ comment }, 201);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const writeErr = writeAccessErrorResponse(error);
    if (writeErr) return writeErr;
    if (error instanceof CommentServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to create comment", 500);
  }
}
