import { AUTH_COOKIES } from "@/lib/auth/constants";
import { ROUTES } from "@/lib/constants";

/** Auth pages the native shell may show without a session. */
export const NATIVE_PUBLIC_PATHS = new Set([
  ROUTES.login,
  ROUTES.register,
  ROUTES.signup,
  ROUTES.forgotPassword,
  "/reset-password",
  "/verify-email",
  ROUTES.help,
  ROUTES.privacy,
  ROUTES.terms,
]);

export function isNativePublicPath(pathname: string): boolean {
  for (const route of NATIVE_PUBLIC_PATHS) {
    if (pathname === route || pathname.startsWith(`${route}/`)) return true;
  }
  return false;
}

export function safeAuthRedirectPath(redirect: string | null | undefined): string {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return ROUTES.login;
  }
  return redirect;
}

/** Best-effort client cleanup (httpOnly cookies are cleared by the server). */
export function clearClientAuthStorage(): void {
  if (typeof window === "undefined") return;

  const host = window.location.hostname;
  for (const name of Object.values(AUTH_COOKIES)) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=${host}`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }

  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }
}

export function buildLogoutRedirectUrl(redirect = ROUTES.login): string {
  const path = safeAuthRedirectPath(redirect);
  return `/api/auth/logout?redirect=${encodeURIComponent(path)}`;
}
