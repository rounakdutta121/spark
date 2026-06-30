import { NextRequest } from "next/server";
import { errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { conversationQuerySchema } from "@/lib/schemas/chat";
import { listConversations } from "@/services/chat/conversation.service";
import { gateVerifiedUser } from "@/lib/api/verified-gate";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const gate = await gateVerifiedUser(userId);
    if (gate) return gate;
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = conversationQuerySchema.safeParse(params);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const result = await listConversations(userId, parsed.data);
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    console.error("GET conversations error:", error);
    return errorResponse("Failed to fetch conversations", 500);
  }
}
