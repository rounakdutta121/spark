import {
  successResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { touchUserPresence } from "@/services/chat/poll.service";

export async function POST() {
  try {
    const userId = await requireUserId();
    await touchUserPresence(userId);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    console.error("POST presence heartbeat error:", error);
    return successResponse({ ok: true });
  }
}
