-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVERSED');

-- CreateTable
CREATE TABLE "FamilyTransactionCategory" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyTransactionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyTransaction" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amountMinorUnits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "paymentMethod" TEXT,
    "idempotencyKey" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyReceipt" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyBudget" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "categoryId" TEXT,
    "amountMinorUnits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FamilyTransactionCategory_familyId_type_idx" ON "FamilyTransactionCategory"("familyId", "type");

-- CreateIndex
CREATE INDEX "FamilyTransaction_familyId_type_date_idx" ON "FamilyTransaction"("familyId", "type", "date");

-- CreateIndex
CREATE INDEX "FamilyTransaction_familyId_status_idx" ON "FamilyTransaction"("familyId", "status");

-- CreateIndex
CREATE INDEX "FamilyTransaction_categoryId_idx" ON "FamilyTransaction"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyTransaction_familyId_idempotencyKey_key" ON "FamilyTransaction"("familyId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "FamilyReceipt_familyId_transactionId_idx" ON "FamilyReceipt"("familyId", "transactionId");

-- CreateIndex
CREATE INDEX "FamilyBudget_familyId_startDate_endDate_idx" ON "FamilyBudget"("familyId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "FamilyBudget_categoryId_idx" ON "FamilyBudget"("categoryId");

-- AddForeignKey
ALTER TABLE "FamilyTransactionCategory" ADD CONSTRAINT "FamilyTransactionCategory_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyTransaction" ADD CONSTRAINT "FamilyTransaction_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyTransaction" ADD CONSTRAINT "FamilyTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FamilyTransactionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyTransaction" ADD CONSTRAINT "FamilyTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyTransaction" ADD CONSTRAINT "FamilyTransaction_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyReceipt" ADD CONSTRAINT "FamilyReceipt_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyReceipt" ADD CONSTRAINT "FamilyReceipt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "FamilyTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyReceipt" ADD CONSTRAINT "FamilyReceipt_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyBudget" ADD CONSTRAINT "FamilyBudget_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyBudget" ADD CONSTRAINT "FamilyBudget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FamilyTransactionCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyBudget" ADD CONSTRAINT "FamilyBudget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
