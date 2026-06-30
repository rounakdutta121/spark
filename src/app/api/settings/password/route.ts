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
import { changePasswordSchema } from "@/lib/schemas/moderation.schema";
import {
  changePassword,
  AccountServiceError,
} from "@/services/account/account.service";

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    await changePassword(
      userId,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    return successResponse({ message: "Password updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof AccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    return errorResponse("Failed to change password", 500);
  }
}
