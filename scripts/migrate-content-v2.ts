import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Applying Content OS v2 migration...");
  await prisma.$executeRawUnsafe(`ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "contentUrl" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "contentType" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "productTags" TEXT NOT NULL DEFAULT '[]'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "signalScore" DOUBLE PRECISION NOT NULL DEFAULT 0`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "aiSignals" TEXT NOT NULL DEFAULT '[]'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "pushedToWarRoom" BOOLEAN NOT NULL DEFAULT false`);
  console.log("✅ Migration applied.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
