import {
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  requireVerifiedUserId,
  unauthorizedResponse,
  UnauthorizedError,
  writeAccessErrorResponse,
} from "@/lib/api/require-auth";
import {
  followUser,
  unfollowUser,
  FollowServiceError,
} from "@/services/social/follow.service";
import { createNotification } from "@/services/chat/notification.service";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const userId = await requireVerifiedUserId();
    const { id } = await context.params;
    const result = await followUser(userId, id);

    const follower = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (result.status === "ACCEPTED") {
      await createNotification({
        userId: id,
        type: "FOLLOW",
        title: "New follower",
        body: follower?.name,
        data: { userId },
      });
    } else if (result.status === "PENDING") {
      await createNotification({
        userId: id,
        type: "FOLLOW_REQUEST",
        title: "New follow request",
        body: follower?.name,
        data: { userId },
      });
    }

    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const writeErr = writeAccessErrorResponse(error);
    if (writeErr) return writeErr;
    if (error instanceof FollowServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    return errorResponse("Failed to follow", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireVerifiedUserId();
    const { id } = await context.params;
    const result = await unfollowUser(userId, id);
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const writeErr = writeAccessErrorResponse(error);
    if (writeErr) return writeErr;
    return errorResponse("Failed to unfollow", 500);
  }
}
