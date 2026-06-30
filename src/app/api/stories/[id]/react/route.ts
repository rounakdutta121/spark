import { z } from "zod";
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
  reactToStory,
  StoryServiceError,
} from "@/services/social/story.service";

const schema = z.object({ emoji: z.string().min(1).max(8) });

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    await reactToStory(userId, id, parsed.data.emoji);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof StoryServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to react", 500);
  }
}
