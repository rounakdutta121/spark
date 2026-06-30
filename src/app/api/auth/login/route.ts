import { NextRequest } from "next/server";
import { loginSchema } from "@/schemas/auth/login.schema";
import { RATE_LIMIT } from "@/lib/auth/constants";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { getClientIp, getRequestMeta } from "@/lib/api/request-meta";
import { logger } from "@/lib/logger";
import {
  errorResponse,
  setAuthCookiesOnResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  AuthServiceError,
  loginUser,
} from "@/services/auth/auth.service";

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimitKey = `login:${clientIp}`;

  const { allowed, retryAfterMs } = await checkRateLimit(
    rateLimitKey,
    RATE_LIMIT.login.maxAttempts,
    RATE_LIMIT.login.windowMs,
  );

  if (!allowed) {
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    return errorResponse(
      `Too many login attempts. Try again in ${retryAfterSec} seconds.`,
      429,
      "RATE_LIMITED",
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const result = await loginUser(parsed.data, getRequestMeta(request));
    await resetRateLimit(rateLimitKey);
    logger.auth("Login success", { userId: result.user.id, ip: clientIp });

    const response = successResponse({ user: result.user });
    const rememberMe = parsed.data.rememberMe ?? false;

    return setAuthCookiesOnResponse(
      response,
      result.accessToken,
      result.refreshToken,
      rememberMe,
    );
  } catch (error) {
    if (error instanceof AuthServiceError) {
      logger.auth("Login failed", {
        ip: clientIp,
        reason: error.message,
        status: error.statusCode,
      });
      return errorResponse(error.message, error.statusCode);
    }
    logger.error("Login error", {
      ip: clientIp,
      error: error instanceof Error ? error.message : "unknown",
    });
    return errorResponse("Login failed", 500);
  }
}
