import { randomBytes } from "crypto";
import type { VerificationTokenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth/tokens";

const EXPIRY_MS: Record<VerificationTokenType, number> = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
};

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createVerificationToken(
  userId: string,
  type: VerificationTokenType,
): Promise<string> {
  const raw = generateVerificationToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + EXPIRY_MS[type]);

  await prisma.verificationToken.deleteMany({ where: { userId, type } });
  await prisma.verificationToken.create({
    data: { userId, type, tokenHash, expiresAt },
  });

  return raw;
}

export async function consumeVerificationToken(
  rawToken: string,
  type: VerificationTokenType,
): Promise<string> {
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!stored || stored.type !== type || stored.expiresAt < new Date()) {
    throw new VerificationError("Invalid or expired token", 400);
  }

  await prisma.verificationToken.delete({ where: { id: stored.id } });
  return stored.userId;
}

export class VerificationError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "VerificationError";
  }
}
