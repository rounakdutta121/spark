import { checkRateLimit } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/api/request-meta";
import { logger } from "@/lib/logger";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { verifyEmailSchema } from "@/lib/schemas/moderation.schema";
import {
  verifyEmail,
  VerificationError,
} from "@/services/auth/auth.service";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request as import("next/server").NextRequest);
    const rate = await checkRateLimit(`verify-email:${ip}`, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return errorResponse("Too many attempts. Try again later.", 429);
    }

    const body = await request.json();
    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const user = await verifyEmail(parsed.data.token);
    logger.auth("Email verified", { userId: user.id });
    return successResponse({ user, message: "Email verified successfully" });
  } catch (error) {
    if (error instanceof VerificationError) {
      return errorResponse(error.message, error.statusCode);
    }
    logger.error("Verify email error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return errorResponse("Failed to verify email", 500);
  }
}
