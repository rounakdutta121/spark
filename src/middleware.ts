import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIES } from "@/lib/auth/constants";
import { getJwtSecret } from "@/lib/auth/secrets";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/help",
  "/privacy",
  "/terms",
];

const authRoutes = ["/login", "/register", "/signup", "/forgot-password"];

const publicApiPrefixes = [
  "/api/health",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
];

function getJwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

async function isValidAccessToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload.type === "access";
  } catch {
    return false;
  }
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isPublicApi(pathname: string): boolean {
  return publicApiPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => pathname.startsWith(route));
}

const legacyDatingRedirects: Record<string, string> = {
  "/discover": "/feed",
  "/matches": "/messages",
  "/likes": "/notifications",
  "/history": "/feed",
  "/activity": "/notifications",
  "/premium": "/feed",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacy = legacyDatingRedirects[pathname];
  if (legacy) {
    return addSecurityHeaders(NextResponse.redirect(new URL(legacy, request.url)));
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname)) {
      return addSecurityHeaders(NextResponse.next());
    }

    const accessToken = request.cookies.get(AUTH_COOKIES.accessToken)?.value;
    const refreshToken = request.cookies.get(AUTH_COOKIES.refreshToken)?.value;

    if (accessToken && (await isValidAccessToken(accessToken))) {
      return addSecurityHeaders(NextResponse.next());
    }

    if (refreshToken && pathname.startsWith("/api/")) {
      return addSecurityHeaders(NextResponse.next());
    }

    return addSecurityHeaders(
      NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      ),
    );
  }

  const accessToken = request.cookies.get(AUTH_COOKIES.accessToken)?.value;
  const refreshToken = request.cookies.get(AUTH_COOKIES.refreshToken)?.value;

  const hasValidAccess =
    !!accessToken && (await isValidAccessToken(accessToken));
  const hasRefresh = !!refreshToken;

  if (isAuthRoute(pathname) && (hasValidAccess || hasRefresh)) {
    return addSecurityHeaders(NextResponse.redirect(new URL("/feed", request.url)));
  }

  if (!isPublicRoute(pathname) && !hasValidAccess && !hasRefresh) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self' ws: wss:; frame-ancestors 'none';",
  );
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
