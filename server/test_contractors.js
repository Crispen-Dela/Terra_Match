import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const profiles = await prisma.contractorProfile.findMany({ include: { user: true } });
  console.log(JSON.stringify(profiles, null, 2));
}
main().finally(() => prisma.$disconnect());
