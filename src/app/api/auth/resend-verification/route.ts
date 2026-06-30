import { NextRequest } from "next/server";
import { resolveAppUrl } from "@/lib/app-url";
import { errorResponse, successResponse } from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { resendVerificationEmail } from "@/services/auth/auth.service";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const rate = await checkRateLimit(`resend:${userId}`, 3, 60 * 60 * 1000);
    if (!rate.allowed) {
      return errorResponse("Too many requests. Try again later.", 429);
    }

    await resendVerificationEmail(userId, resolveAppUrl(request));
    return successResponse({ message: "Verification email sent" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    console.error("Resend verification error:", error);
    return errorResponse("Failed to send verification email", 500);
  }
}
