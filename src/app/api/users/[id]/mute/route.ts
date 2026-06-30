import {
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { muteUser, unmuteUser } from "@/services/moderation/mute.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    await muteUser(userId, id);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to mute user", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    await unmuteUser(userId, id);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to unmute user", 500);
  }
}
