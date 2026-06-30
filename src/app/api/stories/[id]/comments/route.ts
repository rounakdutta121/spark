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
import {
  createStoryCommentSchema,
  storyCommentQuerySchema,
} from "@/schemas/social/story-comment.schema";
import {
  createStoryComment,
  getStoryComments,
  StoryCommentServiceError,
} from "@/services/social/story-comment.service";
import { StoryServiceError } from "@/services/social/story.service";
import { SocialPermissionError } from "@/services/social/permission.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const parsed = storyCommentQuerySchema.safeParse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const result = await getStoryComments(
      userId,
      id,
      parsed.data.cursor,
      parsed.data.limit,
    );
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof StoryServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to load comments", 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = createStoryCommentSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const comment = await createStoryComment(userId, id, parsed.data.text);
    return successResponse({ comment }, 201);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof StoryServiceError || error instanceof StoryCommentServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    if (error instanceof SocialPermissionError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to create comment", 500);
  }
}
