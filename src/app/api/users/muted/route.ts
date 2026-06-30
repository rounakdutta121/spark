import {
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { listMutedUsers } from "@/services/moderation/mute.service";

export async function GET() {
  try {
    const userId = await requireUserId();
    const muted = await listMutedUsers(userId);
    return successResponse({ muted });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to load muted users", 500);
  }
}
