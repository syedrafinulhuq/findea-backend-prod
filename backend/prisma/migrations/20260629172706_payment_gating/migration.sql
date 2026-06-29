-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('ORDER', 'GIFT_CARD', 'SUBSCRIPTION');

-- AlterEnum
ALTER TYPE "GiftCardStatus" ADD VALUE 'PENDING';

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "giftCardId" TEXT,
ADD COLUMN     "purpose" "PaymentPurpose" NOT NULL DEFAULT 'ORDER',
ADD COLUMN     "subscriptionId" TEXT,
ALTER COLUMN "orderId" DROP NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'XOF';

-- CreateIndex
CREATE UNIQUE INDEX "Payment_giftCardId_key" ON "Payment"("giftCardId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_subscriptionId_key" ON "Payment"("subscriptionId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

