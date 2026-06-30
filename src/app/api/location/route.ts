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
import {
  ProfileServiceError,
  updateLocation,
} from "@/services/profile/profile.service";
import { locationSchema } from "@/schemas/profile/profile.schema";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body: unknown = await request.json();
    const parsed = locationSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const profile = await updateLocation(userId, parsed.data);
    return successResponse({ profile });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof ProfileServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error("POST location error:", error);
    return errorResponse("Failed to update location", 500);
  }
}
