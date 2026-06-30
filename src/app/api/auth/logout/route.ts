import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIES } from "@/lib/auth/constants";
import { safeAuthRedirectPath } from "@/lib/auth/clear-session";
import {
  clearAuthCookiesOnResponse,
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import { logoutUser } from "@/services/auth/auth.service";

async function revokeSession(request: NextRequest): Promise<void> {
  const refreshToken =
    request.cookies.get(AUTH_COOKIES.refreshToken)?.value ?? null;
  await logoutUser(refreshToken);
}

/** Full navigation logout — clears cookies reliably in native WebViews. */
export async function GET(request: NextRequest) {
  try {
    await revokeSession(request);
  } catch (error) {
    console.error("Logout error:", error);
  }

  const redirect = safeAuthRedirectPath(
    request.nextUrl.searchParams.get("redirect"),
  );
  const response = NextResponse.redirect(new URL(redirect, request.url));
  return clearAuthCookiesOnResponse(response);
}

export async function POST(request: NextRequest) {
  try {
    await revokeSession(request);

    const response = successResponse({ message: "Logged out successfully" });
    return clearAuthCookiesOnResponse(response);
  } catch (error) {
    console.error("Logout error:", error);
    const response = errorResponse("Logout failed", 500);
    return clearAuthCookiesOnResponse(response);
  }
}
