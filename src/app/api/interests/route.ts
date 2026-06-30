import {
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { getAllInterests } from "@/services/profile/profile.service";

export async function GET() {
  try {
    await requireUserId();
    const interests = await getAllInterests();
    return successResponse({ interests });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    console.error("GET interests error:", error);
    return errorResponse("Failed to fetch interests", 500);
  }
}
