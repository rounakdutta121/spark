import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import {
  generateRefreshToken,
  hashToken,
} from "@/lib/auth/tokens";
import {
  REFRESH_TOKEN_EXPIRY_REMEMBER,
  REFRESH_TOKEN_EXPIRY_SESSION,
} from "@/lib/auth/constants";
import { sanitizeEmail, sanitizeName } from "@/lib/auth/sanitize";
import { buildAppLink } from "@/lib/app-url";
import { emailService } from "@/lib/email/email.service";
import {
  createVerificationToken,
  consumeVerificationToken,
  VerificationError,
} from "@/services/auth/verification.service";
import type { AuthUser, LoginCredentials, RegisterCredentials } from "@/types/auth";

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  profileCompleted: boolean;
  emailVerified: boolean;
  role: "USER" | "ADMIN";
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profileCompleted: user.profileCompleted,
    emailVerified: user.emailVerified,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

function getRefreshExpiry(rememberMe: boolean): Date {
  const days = rememberMe
    ? REFRESH_TOKEN_EXPIRY_REMEMBER
    : REFRESH_TOKEN_EXPIRY_SESSION;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

interface SessionMeta {
  userAgent?: string;
  ipAddress?: string;
  appUrl?: string;
}

async function createAuthSession(
  userId: string,
  rememberMe: boolean,
  meta: SessionMeta,
): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
  const expiresAt = getRefreshExpiry(rememberMe);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);

  const session = await prisma.session.create({
    data: {
      userId,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt,
    },
  });

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      sessionId: session.id,
      expiresAt,
    },
  });

  const accessToken = signAccessToken(userId, session.id);

  return { accessToken, refreshToken, sessionId: session.id };
}

export async function registerUser(
  credentials: RegisterCredentials,
  meta: SessionMeta,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const email = sanitizeEmail(credentials.email);
  const name = sanitizeName(credentials.name);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthServiceError("An account with this email already exists", 409);
  }

  const hashedPassword = await hashPassword(credentials.password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const tokens = await createAuthSession(user.id, true, meta);

  const verifyToken = await createVerificationToken(user.id, "EMAIL_VERIFY");
  await emailService.sendVerificationEmail({
    to: user.email,
    name: user.name,
    verifyLink: buildAppLink(
      `/verify-email?token=${verifyToken}`,
      meta.appUrl,
    ),
  });

  return {
    user: toAuthUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function loginUser(
  credentials: LoginCredentials,
  meta: SessionMeta,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const email = sanitizeEmail(credentials.email);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AuthServiceError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AuthServiceError("Account has been suspended", 403);
  }

  const isValid = await verifyPassword(credentials.password, user.password);
  if (!isValid) {
    throw new AuthServiceError("Invalid email or password", 401);
  }

  const tokens = await createAuthSession(
    user.id,
    credentials.rememberMe ?? false,
    meta,
  );

  return {
    user: toAuthUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function refreshAuthTokens(
  refreshToken: string,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const tokenHash = hashToken(refreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true, session: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AuthServiceError("Invalid or expired refresh token", 401);
  }

  if (stored.session.expiresAt < new Date()) {
    throw new AuthServiceError("Session expired", 401);
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);

  await prisma.refreshToken.create({
    data: {
      tokenHash: newTokenHash,
      userId: stored.userId,
      sessionId: stored.sessionId,
      expiresAt: stored.expiresAt,
    },
  });

  const accessToken = signAccessToken(stored.userId, stored.sessionId);

  return {
    user: toAuthUser(stored.user),
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { session: true },
  });

  if (!stored) return;

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.session.delete({ where: { id: stored.sessionId } }),
  ]);
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      profileCompleted: true,
      emailVerified: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) return null;
  return toAuthUser(user);
}

export async function requestPasswordReset(
  email: string,
  appUrl?: string,
): Promise<void> {
  const normalized = sanitizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || !user.isActive) return;

  const token = await createVerificationToken(user.id, "PASSWORD_RESET");
  await emailService.sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetLink: buildAppLink(`/reset-password?token=${token}`, appUrl),
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const userId = await consumeVerificationToken(token, "PASSWORD_RESET");
  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
  await prisma.session.deleteMany({ where: { userId } });
}

export async function verifyEmail(token: string): Promise<AuthUser> {
  const userId = await consumeVerificationToken(token, "EMAIL_VERIFY");
  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true, emailVerifiedAt: new Date() },
  });
  return toAuthUser(user);
}

export async function resendVerificationEmail(
  userId: string,
  appUrl?: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.emailVerified) return;

  const token = await createVerificationToken(user.id, "EMAIL_VERIFY");
  await emailService.sendVerificationEmail({
    to: user.email,
    name: user.name,
    verifyLink: buildAppLink(`/verify-email?token=${token}`, appUrl),
  });
}

export { VerificationError };

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}
