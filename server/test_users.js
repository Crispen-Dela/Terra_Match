import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ select: { email: true, passwordHash: true }});
  console.log(users);
}
run();
