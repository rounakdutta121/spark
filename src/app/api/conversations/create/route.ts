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
import { getOrCreateConversation } from "@/services/chat/conversation-create.service";
import { ChatAccessError } from "@/services/chat/access.service";

const schema = z.object({ userId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const viewerId = await requireUserId();
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const conversationId = await getOrCreateConversation(
      viewerId,
      parsed.data.userId,
    );
    return successResponse({ conversationId }, 201);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof ChatAccessError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    return errorResponse("Failed to start conversation", 500);
  }
}
