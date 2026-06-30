-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "boutiqueId" TEXT,
ADD COLUMN     "serviceProviderId" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Review_boutiqueId_idx" ON "Review"("boutiqueId");

-- CreateIndex
CREATE INDEX "Review_serviceProviderId_idx" ON "Review"("serviceProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_boutiqueId_key" ON "Review"("userId", "boutiqueId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_serviceProviderId_key" ON "Review"("userId", "serviceProviderId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_boutiqueId_fkey" FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

