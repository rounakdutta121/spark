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
  reorderPhotos,
} from "@/services/profile/profile.service";
import { photoOrderSchema } from "@/schemas/profile/profile.schema";

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    const body: unknown = await request.json();
    const parsed = photoOrderSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const profile = await reorderPhotos(userId, parsed.data.photoIds);
    return successResponse({ profile });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof ProfileServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error("PATCH photo order error:", error);
    return errorResponse("Failed to reorder photos", 500);
  }
}
