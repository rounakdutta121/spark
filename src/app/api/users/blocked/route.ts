import { errorResponse, successResponse } from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { listBlockedUsers } from "@/services/moderation/block.service";

export async function GET() {
  try {
    const userId = await requireUserId();
    const blocked = await listBlockedUsers(userId);
    return successResponse({ blocked });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    console.error("GET blocked users error:", error);
    return errorResponse("Failed to fetch blocked users", 500);
  }
}
