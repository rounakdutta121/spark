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
import { searchQuerySchema } from "@/schemas/social/post.schema";
import {
  searchHashtags,
  searchPosts,
  searchUsers,
} from "@/services/social/search.service";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const parsed = searchQuerySchema.safeParse({
      q: searchParams.get("q"),
      type: searchParams.get("type") ?? "all",
      limit: searchParams.get("limit") ?? 20,
    });
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { q, type, limit = 20 } = parsed.data;

    const [users, hashtags, posts] = await Promise.all([
      type === "posts" || type === "hashtags"
        ? Promise.resolve([])
        : searchUsers(userId, q, limit),
      type === "users" || type === "posts"
        ? Promise.resolve([])
        : searchHashtags(q, limit),
      type === "users" || type === "hashtags"
        ? Promise.resolve([])
        : searchPosts(userId, q, limit),
    ]);

    return successResponse({ users, hashtags, posts });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Search failed", 500);
  }
}
