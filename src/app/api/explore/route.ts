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
import { exploreQuerySchema } from "@/schemas/social/post.schema";
import { getExploreFeed } from "@/services/social/feed.service";
import { getExploreMeta } from "@/services/social/explore-meta.service";
import { searchExplorePosts } from "@/services/social/search.service";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const parsed = exploreQuerySchema.safeParse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    });
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { cursor, limit, q } = parsed.data;
    const includeMeta = searchParams.get("meta") === "1" && !q;

    const [result, meta] = await Promise.all([
      q
        ? searchExplorePosts(userId, q, cursor, limit)
        : getExploreFeed(userId, cursor, limit),
      includeMeta ? getExploreMeta(userId) : Promise.resolve(undefined),
    ]);
    return successResponse({ ...result, meta });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to load explore", 500);
  }
}
