const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, employeeId: true, email: true } });
  console.log("Users in DB:");
  console.dir(users, { depth: null });
}
main().finally(() => prisma.$disconnect());
