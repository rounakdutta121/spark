import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { requireUserId, UnauthorizedError, unauthorizedResponse } from "@/lib/api/require-auth";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { CHAT } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const rate = await checkRateLimit(`gifs:${userId}`, 30, 60 * 1000);
    if (!rate.allowed) {
      return errorResponse("Too many requests. Try again later.", 429);
    }

    const query = request.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  const gifs = CHAT.placeholderGifs.filter(
    (gif) => !query || gif.title.toLowerCase().includes(query),
  );
  return successResponse({ gifs });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
