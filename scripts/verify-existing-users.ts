import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { emailVerified: false },
    data: { emailVerified: true, emailVerifiedAt: new Date() },
  });
  console.log(`Marked ${result.count} users as email verified`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
