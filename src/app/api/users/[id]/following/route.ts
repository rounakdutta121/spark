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
import { feedQuerySchema } from "@/schemas/social/post.schema";
import {
  listFollowing,
  FollowServiceError,
} from "@/services/social/follow.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const viewerId = await requireUserId();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const parsed = feedQuerySchema.safeParse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const result = await listFollowing(
      viewerId,
      id,
      parsed.data.cursor,
      parsed.data.limit,
    );
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof FollowServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    return errorResponse("Failed to load following", 500);
  }
}
