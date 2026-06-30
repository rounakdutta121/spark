import { NextRequest } from "next/server";
import { errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import {
  authErrorResponse,
  requireVerifiedUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { conversationQuerySchema } from "@/lib/schemas/chat";
import { ChatAccessError } from "@/services/chat/access.service";
import { listConversations } from "@/services/chat/conversation.service";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireVerifiedUserId();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = conversationQuerySchema.safeParse(params);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const result = await listConversations(userId, parsed.data);
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const access = authErrorResponse(error);
    if (access) return access;
    if (error instanceof ChatAccessError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("GET conversations error:", error);
    return errorResponse("Failed to fetch conversations", 500);
  }
}
