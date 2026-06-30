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
  getProfile,
  ProfileServiceError,
  updateProfile,
} from "@/services/profile/profile.service";
import { updateProfileSchema } from "@/schemas/profile/profile.schema";

export async function GET() {
  try {
    const userId = await requireUserId();
    const profile = await getProfile(userId);
    return successResponse({ profile });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    console.error("GET profile error:", error);
    return errorResponse("Failed to fetch profile", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const body: unknown = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const profile = await updateProfile(userId, parsed.data);
    return successResponse({ profile });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof ProfileServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error("PUT profile error:", error);
    return errorResponse("Failed to update profile", 500);
  }
}
