import { errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { reactionSchema } from "@/lib/schemas/chat";
import { ChatAccessError } from "@/services/chat/access.service";
import {
  addReaction,
  MessageServiceError,
} from "@/services/chat/message.service";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = reactionSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const message = await addReaction(
      userId,
      parsed.data.messageId,
      parsed.data.emoji,
    );
    return successResponse({ message });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof MessageServiceError || error instanceof ChatAccessError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("POST reaction error:", error);
    return errorResponse("Failed to add reaction", 500);
  }
}
