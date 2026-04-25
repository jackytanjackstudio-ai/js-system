import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting backup...");

  const [
    users, outlets, products, customerInputs, salesReports,
    executionTasks, rewardPoints, systemFeedback, creatorContent,
  ] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, outletId: true, phone: true, isActive: true, createdAt: true, updatedAt: true } }),
    prisma.outlet.findMany(),
    prisma.product.findMany(),
    prisma.customerInput.findMany(),
    prisma.salesReport.findMany(),
    prisma.executionTask.findMany(),
    prisma.rewardPoint.findMany(),
    prisma.systemFeedback.findMany(),
    prisma.creatorContent.findMany(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    counts: {
      users: users.length,
      outlets: outlets.length,
      products: products.length,
      customerInputs: customerInputs.length,
      salesReports: salesReports.length,
      executionTasks: executionTasks.length,
      rewardPoints: rewardPoints.length,
      systemFeedback: systemFeedback.length,
      creatorContent: creatorContent.length,
    },
    data: {
      users, outlets, products, customerInputs, salesReports,
      executionTasks, rewardPoints, systemFeedback, creatorContent,
    },
  };

  const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(filename, JSON.stringify(backup, null, 2));

  console.log(`Backup saved: ${filename}`);
  console.log("Record counts:", backup.counts);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
