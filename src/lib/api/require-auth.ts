import { errorResponse } from "@/lib/api/response";
import { getAuthenticatedPayload, getRefreshTokenFromCookies } from "@/lib/api/auth-request";
import { hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/prisma";
import {
  assertAccountActive,
  assertEmailVerified,
  AccountSuspendedError,
  EmailNotVerifiedError,
} from "@/lib/api/require-verified";

export { EmailNotVerifiedError, AccountSuspendedError } from "@/lib/api/require-verified";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

async function getUserIdFromRefreshToken(): Promise<string | null> {
  const refreshToken = await getRefreshTokenFromCookies();
  if (!refreshToken) return null;

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    return null;
  }

  return stored.userId;
}

export async function requireUserId(): Promise<string> {
  const payload = await getAuthenticatedPayload();
  let userId: string | null = payload?.sub ?? null;

  if (!userId) {
    userId = await getUserIdFromRefreshToken();
  }

  if (!userId) throw new UnauthorizedError();

  await assertAccountActive(userId);
  return userId;
}

export async function requireVerifiedUserId(): Promise<string> {
  const userId = await requireUserId();
  await assertEmailVerified(userId);
  return userId;
}

export function writeAccessErrorResponse(error: unknown) {
  if (error instanceof EmailNotVerifiedError) {
    return errorResponse(
      "Please verify your email to use this feature",
      403,
      "EMAIL_NOT_VERIFIED",
    );
  }
  if (error instanceof AccountSuspendedError) {
    return errorResponse("Account suspended", 403, "ACCOUNT_SUSPENDED");
  }
  return null;
}

export function unauthorizedResponse() {
  return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
}

export function authErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return unauthorizedResponse();
  return writeAccessErrorResponse(error);
}
