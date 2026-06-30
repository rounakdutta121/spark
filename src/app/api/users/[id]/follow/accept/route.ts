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
  acceptFollowRequest,
  FollowServiceError,
} from "@/services/social/follow.service";
import { createNotification } from "@/services/chat/notification.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id: followerId } = await context.params;
    const result = await acceptFollowRequest(userId, followerId);

    await createNotification({
      userId: followerId,
      type: "FOLLOW",
      title: "Follow request accepted",
      data: { userId },
    });

    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof FollowServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to accept request", 500);
  }
}
