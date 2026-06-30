import type { NextRequest } from "next/server";
import { resolveAppUrl } from "@/lib/app-url";

export function getRequestMeta(request: NextRequest): {
  userAgent?: string;
  ipAddress?: string;
  appUrl: string;
} {
  return {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined,
    appUrl: resolveAppUrl(request),
  };
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
