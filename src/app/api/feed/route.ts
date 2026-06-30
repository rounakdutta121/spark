import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  authErrorResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { feedQuerySchema } from "@/schemas/social/post.schema";
import { getHomeFeed } from "@/services/social/feed.service";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const parsed = feedQuerySchema.safeParse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const result = await getHomeFeed(
      userId,
      parsed.data.cursor,
      parsed.data.limit,
    );
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      const res = authErrorResponse(error);
      if (res) return res;
    }
    console.error("GET feed error:", error);
    return errorResponse("Failed to load feed", 500);
  }
}
