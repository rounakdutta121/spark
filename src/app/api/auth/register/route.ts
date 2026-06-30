import { NextRequest } from "next/server";
import { registerSchema } from "@/schemas/auth/register.schema";
import { getRequestMeta } from "@/lib/api/request-meta";
import {
  errorResponse,
  setAuthCookiesOnResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  AuthServiceError,
  registerUser,
} from "@/services/auth/auth.service";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rate = await checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return errorResponse("Too many registration attempts", 429);
    }

    const body: unknown = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const result = await registerUser(parsed.data, getRequestMeta(request));

    const response = successResponse({ user: result.user }, 201);

    return setAuthCookiesOnResponse(
      response,
      result.accessToken,
      result.refreshToken,
      true,
    );
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error("Register error:", error);
    return errorResponse("Registration failed", 500);
  }
}
