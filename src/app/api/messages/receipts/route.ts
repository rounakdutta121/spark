import { z } from "zod";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  authErrorResponse,
  requireVerifiedUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { ChatAccessError } from "@/services/chat/access.service";
import {
  markMessagesDelivered,
  markMessagesSeen,
  MessageServiceError,
} from "@/services/chat/message.service";

const receiptsSchema = z.object({
  conversationId: z.string().min(1),
  messageIds: z.array(z.string().min(1)).min(1),
  type: z.enum(["delivered", "seen"]),
});

export async function POST(request: Request) {
  try {
    const userId = await requireVerifiedUserId();

    const body = await request.json();
    const parsed = receiptsSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { conversationId, messageIds, type } = parsed.data;
    const result =
      type === "delivered"
        ? await markMessagesDelivered(userId, conversationId, messageIds)
        : await markMessagesSeen(userId, conversationId, messageIds);

    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const access = authErrorResponse(error);
    if (access) return access;
    if (error instanceof ChatAccessError || error instanceof MessageServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("POST message receipts error:", error);
    return errorResponse("Failed to update receipts", 500);
  }
}
