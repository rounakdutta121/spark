import { cookies } from "next/headers";
import { AUTH_COOKIES } from "@/lib/auth/constants";
import { verifyAccessToken } from "@/lib/auth/jwt";
import type { AccessTokenPayload } from "@/types/auth";

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIES.accessToken)?.value ?? null;
}

export async function getRefreshTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIES.refreshToken)?.value ?? null;
}

export async function getAuthenticatedPayload(): Promise<AccessTokenPayload | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}
