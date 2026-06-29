-- CreateEnum
CREATE TYPE "BoutiqueStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'VENDOR';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "boutiqueId" TEXT;

-- CreateTable
CREATE TABLE "Boutique" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "location" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" "BoutiqueStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Boutique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Boutique_ownerId_key" ON "Boutique"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Boutique_slug_key" ON "Boutique"("slug");

-- CreateIndex
CREATE INDEX "Boutique_status_idx" ON "Boutique"("status");

-- CreateIndex
CREATE INDEX "Boutique_city_idx" ON "Boutique"("city");

-- CreateIndex
CREATE INDEX "Product_boutiqueId_idx" ON "Product"("boutiqueId");

-- AddForeignKey
ALTER TABLE "Boutique" ADD CONSTRAINT "Boutique_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_boutiqueId_fkey" FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

