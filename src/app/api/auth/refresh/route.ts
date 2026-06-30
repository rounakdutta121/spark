import { NextRequest } from "next/server";
import { AUTH_COOKIES } from "@/lib/auth/constants";
import {
  clearAuthCookiesOnResponse,
  errorResponse,
  setAuthCookiesOnResponse,
  successResponse,
} from "@/lib/api/response";
import {
  AuthServiceError,
  refreshAuthTokens,
} from "@/services/auth/auth.service";

export async function POST(request: NextRequest) {
  try {
    const refreshToken =
      request.cookies.get(AUTH_COOKIES.refreshToken)?.value;

    if (!refreshToken) {
      return errorResponse("Refresh token not found", 401, "NO_REFRESH_TOKEN");
    }

    const result = await refreshAuthTokens(refreshToken);

    const response = successResponse({ user: result.user });

    return setAuthCookiesOnResponse(
      response,
      result.accessToken,
      result.refreshToken,
      true,
    );
  } catch (error) {
    if (error instanceof AuthServiceError) {
      const response = errorResponse(error.message, error.statusCode);
      return clearAuthCookiesOnResponse(response);
    }
    console.error("Refresh error:", error);
    const response = errorResponse("Token refresh failed", 500);
    return clearAuthCookiesOnResponse(response);
  }
}
