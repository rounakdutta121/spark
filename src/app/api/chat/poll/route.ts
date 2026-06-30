import { NextRequest } from "next/server";
import { z } from "zod";
import { CHAT } from "@/lib/constants";
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
import { pollConversationUpdates } from "@/services/chat/poll.service";

const pollQuerySchema = z.object({
  conversationId: z.string().min(1),
  since: z.string().optional(),
  timeoutMs: z.coerce
    .number()
    .int()
    .min(1_500)
    .max(8_000)
    .optional(),
});

export const maxDuration = 10;

export async function GET(request: NextRequest) {
  try {
    const userId = await requireVerifiedUserId();

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = pollQuerySchema.safeParse(params);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const result = await pollConversationUpdates(
      userId,
      parsed.data.conversationId,
      {
        since: parsed.data.since,
        timeoutMs: parsed.data.timeoutMs ?? CHAT.pollActiveTimeoutMs,
      },
    );

    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const access = authErrorResponse(error);
    if (access) return access;
    if (error instanceof ChatAccessError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("GET chat poll error:", error);
    return errorResponse("Failed to poll chat", 500);
  }
}
