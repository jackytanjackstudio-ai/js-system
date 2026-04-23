-- AlterTable
ALTER TABLE "CreatorContent" ADD COLUMN     "month" INTEGER,
ADD COLUMN     "week" TEXT;

-- AlterTable
ALTER TABLE "CustomerInput" ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "month" INTEGER,
ADD COLUMN     "week" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'customer';
