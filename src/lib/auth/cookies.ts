import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { AUTH_COOKIES } from "@/lib/auth/constants";

const isProduction = process.env.NODE_ENV === "production";

function baseCookieOptions(maxAge: number): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function getAccessTokenCookieOptions(): Partial<ResponseCookie> {
  return baseCookieOptions(15 * 60); // 15 minutes
}

export function getRefreshTokenCookieOptions(rememberMe: boolean): Partial<ResponseCookie> {
  const days = rememberMe ? 30 : 1;
  return baseCookieOptions(days * 24 * 60 * 60);
}

export function buildAuthCookies(
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean,
): { name: string; value: string; options: Partial<ResponseCookie> }[] {
  return [
    {
      name: AUTH_COOKIES.accessToken,
      value: accessToken,
      options: getAccessTokenCookieOptions(),
    },
    {
      name: AUTH_COOKIES.refreshToken,
      value: refreshToken,
      options: getRefreshTokenCookieOptions(rememberMe),
    },
  ];
}

export function buildClearAuthCookies(): {
  name: string;
  value: string;
  options: Partial<ResponseCookie>;
}[] {
  const clearOptions: Partial<ResponseCookie> = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };

  return [
    { name: AUTH_COOKIES.accessToken, value: "", options: clearOptions },
    { name: AUTH_COOKIES.refreshToken, value: "", options: clearOptions },
  ];
}
