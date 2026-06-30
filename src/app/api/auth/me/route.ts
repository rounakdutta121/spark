import {
  clearAuthCookiesOnResponse,
  errorResponse,
  setAuthCookiesOnResponse,
  successResponse,
} from "@/lib/api/response";
import {
  getAuthenticatedPayload,
  getRefreshTokenFromCookies,
} from "@/lib/api/auth-request";
import {
  AuthServiceError,
  getUserById,
  refreshAuthTokens,
} from "@/services/auth/auth.service";

export async function GET() {
  try {
    const payload = await getAuthenticatedPayload();

    if (payload) {
      const user = await getUserById(payload.sub);
      if (!user) {
        const response = errorResponse("User not found", 401, "UNAUTHORIZED");
        return clearAuthCookiesOnResponse(response);
      }
      return successResponse({ user });
    }

    const refreshToken = await getRefreshTokenFromCookies();
    if (!refreshToken) {
      return errorResponse("Not authenticated", 401, "UNAUTHORIZED");
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
    console.error("Me error:", error);
    return errorResponse("Failed to fetch user", 500);
  }
}
