import { errorResponse, successResponse } from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import {
  getPublicProfile,
  PublicProfileError,
} from "@/services/profile/public-profile.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const viewerId = await requireUserId();
    const { id: targetUserId } = await context.params;
    const profile = await getPublicProfile(viewerId, targetUserId);
    return successResponse({ profile });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof PublicProfileError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("GET user profile error:", error);
    return errorResponse("Failed to load profile", 500);
  }
}
