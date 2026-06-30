import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { buildAuthCookies, buildClearAuthCookies } from "@/lib/auth/cookies";

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status: number,
  code?: string,
): NextResponse {
  return NextResponse.json(
    { success: false, error: message, code },
    { status },
  );
}

export function validationErrorResponse(error: ZodError): NextResponse {
  const firstError = error.issues[0]?.message ?? "Validation failed";
  return errorResponse(firstError, 400, "VALIDATION_ERROR");
}

export function setAuthCookiesOnResponse(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean,
): NextResponse {
  for (const cookie of buildAuthCookies(accessToken, refreshToken, rememberMe)) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}

export function clearAuthCookiesOnResponse(response: NextResponse): NextResponse {
  for (const cookie of buildClearAuthCookies()) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}
