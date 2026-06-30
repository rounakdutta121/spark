import { errorResponse, successResponse } from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { ChatAccessError } from "@/services/chat/access.service";
import { getConversation } from "@/services/chat/conversation.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const conversation = await getConversation(userId, id);
    return successResponse({ conversation });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof ChatAccessError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("GET conversation error:", error);
    return errorResponse("Failed to fetch conversation", 500);
  }
}
