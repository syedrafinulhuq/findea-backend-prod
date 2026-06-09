-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PRODUCT', 'SERVICE', 'BOUTIQUE', 'REGISTRY');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isBooked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'PRODUCT';
