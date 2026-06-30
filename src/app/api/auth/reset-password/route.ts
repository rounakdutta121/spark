import { checkRateLimit } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/api/request-meta";
import { logger } from "@/lib/logger";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { resetPasswordSchema } from "@/lib/schemas/moderation.schema";
import {
  AuthServiceError,
  resetPassword,
  VerificationError,
} from "@/services/auth/auth.service";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request as import("next/server").NextRequest);
    const rate = await checkRateLimit(`reset-password:${ip}`, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return errorResponse("Too many attempts. Try again later.", 429);
    }

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    await resetPassword(parsed.data.token, parsed.data.password);
    logger.auth("Password reset completed");
    return successResponse({ message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof VerificationError) {
      return errorResponse(error.message, error.statusCode);
    }
    if (error instanceof AuthServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    logger.error("Reset password error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return errorResponse("Failed to reset password", 500);
  }
}
