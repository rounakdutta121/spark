import { NextRequest } from "next/server";
import { AUTH_COOKIES } from "@/lib/auth/constants";
import {
  clearAuthCookiesOnResponse,
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import { logoutUser } from "@/services/auth/auth.service";

export async function POST(request: NextRequest) {
  try {
    const refreshToken =
      request.cookies.get(AUTH_COOKIES.refreshToken)?.value ?? null;

    await logoutUser(refreshToken);

    const response = successResponse({ message: "Logged out successfully" });
    return clearAuthCookiesOnResponse(response);
  } catch (error) {
    console.error("Logout error:", error);
    const response = errorResponse("Logout failed", 500);
    return clearAuthCookiesOnResponse(response);
  }
}
