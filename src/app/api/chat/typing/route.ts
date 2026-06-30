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
import { gateVerifiedUser } from "@/lib/api/verified-gate";
import { ChatAccessError } from "@/services/chat/access.service";
import { setTypingState } from "@/services/chat/poll.service";

const typingSchema = z.object({
  conversationId: z.string().min(1),
  isTyping: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const gate = await gateVerifiedUser(userId);
    if (gate) return gate;

    const body = await request.json();
    const parsed = typingSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    await setTypingState(userId, parsed.data.conversationId, parsed.data.isTyping);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof ChatAccessError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("POST chat typing error:", error);
    return errorResponse("Failed to update typing state", 500);
  }
}
