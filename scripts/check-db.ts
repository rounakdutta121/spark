import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
    ORDER BY column_name
  `;
  console.log("users columns:", cols.map((c) => c.column_name).join(", "));

  const users = await prisma.user.findMany({
    select: { id: true, email: true, isActive: true },
    take: 10,
  });
  console.log("users:", JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
