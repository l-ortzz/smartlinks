-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "asaasCustomerId" TEXT,
ADD COLUMN     "asaasSubscriptionId" TEXT,
ADD COLUMN     "nextDueDate" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT;
