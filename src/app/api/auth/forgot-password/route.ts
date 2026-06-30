import { errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import { resolveAppUrl } from "@/lib/app-url";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { forgotPasswordSchema } from "@/lib/schemas/moderation.schema";
import { requestPasswordReset } from "@/services/auth/auth.service";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rate = await checkRateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return errorResponse("Too many requests. Try again later.", 429);
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    await requestPasswordReset(parsed.data.email, resolveAppUrl(request));
    return successResponse({
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return successResponse({
      message: "If an account exists, a reset link has been sent.",
    });
  }
}
