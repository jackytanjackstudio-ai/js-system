-- AlterTable
ALTER TABLE "ProductMaster" ADD COLUMN "customSellingPoints" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "ProductMaster" ADD COLUMN "generatedContent" JSONB;
ALTER TABLE "ProductMaster" ADD COLUMN "material" TEXT;
ALTER TABLE "ProductMaster" ADD COLUMN "salesPitch" TEXT;
ALTER TABLE "ProductMaster" ADD COLUMN "style" TEXT;
ALTER TABLE "ProductMaster" ADD COLUMN "targetUser" TEXT;
