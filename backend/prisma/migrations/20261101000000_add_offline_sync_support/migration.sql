-- AlterEnum
ALTER TYPE "FamilyAuditAction" ADD VALUE IF NOT EXISTS 'RECEIPT_UPLOADED';
ALTER TYPE "FamilyAuditAction" ADD VALUE IF NOT EXISTS 'SYNC_MUTATION_APPLIED';
ALTER TYPE "FamilyAuditAction" ADD VALUE IF NOT EXISTS 'SYNC_MUTATION_REJECTED';

-- AlterTable
ALTER TABLE "FamilyReceipt" ADD COLUMN "checksumSha256" TEXT,
ADD COLUMN "idempotencyKey" TEXT;

-- CreateTable
CREATE TABLE "FamilySyncMutation" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "localRecordId" TEXT NOT NULL,
    "commandType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "conflictCode" TEXT,
    "serverRecordId" TEXT,
    "responseJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilySyncMutation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Family_updatedAt_id_idx" ON "Family"("updatedAt", "id");

-- CreateIndex
CREATE INDEX "FamilyMember_familyId_updatedAt_id_idx" ON "FamilyMember"("familyId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "Notification_familyId_updatedAt_id_idx" ON "Notification"("familyId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "FamilyContributionPlan_familyId_updatedAt_id_idx" ON "FamilyContributionPlan"("familyId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "FamilyContributionCycle_familyId_updatedAt_id_idx" ON "FamilyContributionCycle"("familyId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "FamilyContributionPayment_familyId_updatedAt_id_idx" ON "FamilyContributionPayment"("familyId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "FamilyProject_familyId_updatedAt_id_idx" ON "FamilyProject"("familyId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "FamilyContact_familyId_updatedAt_id_idx" ON "FamilyContact"("familyId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "FamilyTransactionCategory_familyId_updatedAt_id_idx" ON "FamilyTransactionCategory"("familyId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "FamilyTransaction_familyId_updatedAt_id_idx" ON "FamilyTransaction"("familyId", "updatedAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyReceipt_familyId_idempotencyKey_key" ON "FamilyReceipt"("familyId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "FamilyReceipt_familyId_updatedAt_id_idx" ON "FamilyReceipt"("familyId", "updatedAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FamilySyncMutation_familyId_idempotencyKey_key" ON "FamilySyncMutation"("familyId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "FamilySyncMutation_familyId_actorId_createdAt_idx" ON "FamilySyncMutation"("familyId", "actorId", "createdAt");

-- CreateIndex
CREATE INDEX "FamilySyncMutation_familyId_updatedAt_id_idx" ON "FamilySyncMutation"("familyId", "updatedAt", "id");

-- AddForeignKey
ALTER TABLE "FamilySyncMutation" ADD CONSTRAINT "FamilySyncMutation_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
