-- CreateEnum
CREATE TYPE "RegistryType" AS ENUM ('WEDDING', 'BABY', 'BIRTHDAY', 'OTHER');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'PURCHASED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Registry" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "RegistryType" NOT NULL DEFAULT 'WEDDING',
    "description" TEXT,
    "coverImageUrl" TEXT,
    "eventDate" TIMESTAMP(3),
    "shippingLine1" TEXT,
    "shippingCity" TEXT,
    "shippingCountry" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistryItem" (
    "id" TEXT NOT NULL,
    "registryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "desiredQty" INTEGER NOT NULL DEFAULT 1,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistryReservation" (
    "id" TEXT NOT NULL,
    "registryItemId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "message" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Registry_slug_key" ON "Registry"("slug");

-- CreateIndex
CREATE INDEX "Registry_ownerId_idx" ON "Registry"("ownerId");

-- CreateIndex
CREATE INDEX "Registry_type_idx" ON "Registry"("type");

-- CreateIndex
CREATE INDEX "RegistryItem_registryId_idx" ON "RegistryItem"("registryId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistryItem_registryId_productId_key" ON "RegistryItem"("registryId", "productId");

-- CreateIndex
CREATE INDEX "RegistryReservation_registryItemId_idx" ON "RegistryReservation"("registryItemId");

-- CreateIndex
CREATE INDEX "RegistryReservation_userId_idx" ON "RegistryReservation"("userId");

-- AddForeignKey
ALTER TABLE "Registry" ADD CONSTRAINT "Registry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryItem" ADD CONSTRAINT "RegistryItem_registryId_fkey" FOREIGN KEY ("registryId") REFERENCES "Registry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryItem" ADD CONSTRAINT "RegistryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryReservation" ADD CONSTRAINT "RegistryReservation_registryItemId_fkey" FOREIGN KEY ("registryItemId") REFERENCES "RegistryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryReservation" ADD CONSTRAINT "RegistryReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

