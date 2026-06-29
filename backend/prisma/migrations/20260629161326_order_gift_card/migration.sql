-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "giftCardAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "giftCardId" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

