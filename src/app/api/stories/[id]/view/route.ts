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
  markStoryViewed,
  StoryServiceError,
} from "@/services/social/story.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    await markStoryViewed(userId, id);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof StoryServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to mark story viewed", 500);
  }
}
