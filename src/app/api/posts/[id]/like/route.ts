import {
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import {
  requireVerifiedUserId,
  unauthorizedResponse,
  UnauthorizedError,
  writeAccessErrorResponse,
} from "@/lib/api/require-auth";
import {
  togglePostLike,
  PostServiceError,
} from "@/services/social/post.service";
import { createNotification } from "@/services/chat/notification.service";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const userId = await requireVerifiedUserId();
    const { id } = await context.params;
    const result = await togglePostLike(userId, id);

    if (result.liked) {
      const post = await prisma.post.findUnique({
        where: { id },
        select: { authorId: true },
      });
      if (post && post.authorId !== userId) {
        const liker = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });
        await createNotification({
          userId: post.authorId,
          type: "LIKE",
          title: "New like on your post",
          body: liker?.name,
          data: { postId: id, userId },
        });
      }
    }

    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const writeErr = writeAccessErrorResponse(error);
    if (writeErr) return writeErr;
    if (error instanceof PostServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse("Failed to like post", 500);
  }
}
