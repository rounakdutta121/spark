import { errorResponse, successResponse } from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import {
  blockUser,
  BlockServiceError,
  unblockUser,
} from "@/services/moderation/block.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id: blockedId } = await context.params;
    await blockUser(userId, blockedId);
    return successResponse({ blocked: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof BlockServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("Block user error:", error);
    return errorResponse("Failed to block user", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id: blockedId } = await context.params;
    await unblockUser(userId, blockedId);
    return successResponse({ unblocked: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    console.error("Unblock user error:", error);
    return errorResponse("Failed to unblock user", 500);
  }
}
