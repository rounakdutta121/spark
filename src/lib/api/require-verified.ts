import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "@/lib/api/require-auth";

export class EmailNotVerifiedError extends Error {
  constructor() {
    super("Email verification required");
    this.name = "EmailNotVerifiedError";
  }
}

export class AccountSuspendedError extends Error {
  constructor() {
    super("Account suspended");
    this.name = "AccountSuspendedError";
  }
}

export async function assertEmailVerified(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, isActive: true },
  });

  if (!user) throw new UnauthorizedError();
  if (!user.isActive) throw new AccountSuspendedError();
  if (!user.emailVerified) throw new EmailNotVerifiedError();
}

export async function assertAccountActive(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });
  if (!user) throw new UnauthorizedError();
  if (!user.isActive) throw new AccountSuspendedError();
}
