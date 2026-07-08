-- CreateEnum
CREATE TYPE "IncomeRecurrence" AS ENUM ('ONE_TIME', 'MONTHLY');

-- CreateEnum
CREATE TYPE "IncomePaymentStatus" AS ENUM ('NOT_EXPECTED', 'UNPAID', 'PARTIAL', 'PAID', 'OVERPAID');

-- AlterTable
ALTER TABLE "FamilyTransaction"
ADD COLUMN     "incomeRecurrence" "IncomeRecurrence" NOT NULL DEFAULT 'ONE_TIME',
ADD COLUMN     "paymentStatus" "IncomePaymentStatus" NOT NULL DEFAULT 'NOT_EXPECTED',
ADD COLUMN     "expectedAmountMinorUnits" BIGINT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "periodStart" TIMESTAMP(3),
ADD COLUMN     "periodEnd" TIMESTAMP(3),
ADD COLUMN     "propertyName" TEXT;

-- CreateIndex
CREATE INDEX "FamilyTransaction_familyId_incomeRecurrence_dueDate_idx" ON "FamilyTransaction"("familyId", "incomeRecurrence", "dueDate");

-- CreateIndex
CREATE INDEX "FamilyTransaction_familyId_paymentStatus_idx" ON "FamilyTransaction"("familyId", "paymentStatus");
