import { PrismaClient } from "@prisma/client";

const PRISMA_CLIENT_VERSION = "2026-06-29-social-pivot";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion?: string;
};

if (globalForPrisma.prismaClientVersion !== PRISMA_CLIENT_VERSION) {
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
