-- CreateEnum
CREATE TYPE "ContributionCadence" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "ContributionPlanStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContributionCycleStatus" AS ENUM ('OPEN', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ContributionPaymentMethod" AS ENUM ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "ContributionPaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'REVERSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FamilyAuditAction" ADD VALUE 'CONTRIBUTION_PLAN_CREATED';
ALTER TYPE "FamilyAuditAction" ADD VALUE 'CONTRIBUTION_RECORDED';
ALTER TYPE "FamilyAuditAction" ADD VALUE 'CONTRIBUTION_VERIFIED';
ALTER TYPE "FamilyAuditAction" ADD VALUE 'CONTRIBUTION_REVERSED';

-- CreateTable
CREATE TABLE "FamilyContributionPlan" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cadence" "ContributionCadence" NOT NULL,
    "amountMinorUnits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "ContributionPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "FamilyContributionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyContributionAssignment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amountMinorUnits" BIGINT NOT NULL,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyContributionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyContributionCycle" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "expectedMinorUnits" BIGINT NOT NULL,
    "status" "ContributionCycleStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyContributionCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyContributionPayment" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "cycleId" TEXT,
    "memberId" TEXT NOT NULL,
    "amountMinorUnits" BIGINT NOT NULL,
    "method" "ContributionPaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "ContributionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "note" TEXT,
    "idempotencyKey" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "recordedById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyContributionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FamilyContributionPlan_familyId_status_idx" ON "FamilyContributionPlan"("familyId", "status");

-- CreateIndex
CREATE INDEX "FamilyContributionAssignment_memberId_idx" ON "FamilyContributionAssignment"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyContributionAssignment_planId_memberId_key" ON "FamilyContributionAssignment"("planId", "memberId");

-- CreateIndex
CREATE INDEX "FamilyContributionCycle_familyId_dueDate_idx" ON "FamilyContributionCycle"("familyId", "dueDate");

-- CreateIndex
CREATE INDEX "FamilyContributionCycle_planId_periodStart_idx" ON "FamilyContributionCycle"("planId", "periodStart");

-- CreateIndex
CREATE INDEX "FamilyContributionPayment_familyId_status_paidAt_idx" ON "FamilyContributionPayment"("familyId", "status", "paidAt");

-- CreateIndex
CREATE INDEX "FamilyContributionPayment_planId_cycleId_idx" ON "FamilyContributionPayment"("planId", "cycleId");

-- CreateIndex
CREATE INDEX "FamilyContributionPayment_memberId_idx" ON "FamilyContributionPayment"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyContributionPayment_familyId_idempotencyKey_key" ON "FamilyContributionPayment"("familyId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "FamilyContributionPlan" ADD CONSTRAINT "FamilyContributionPlan_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyContributionAssignment" ADD CONSTRAINT "FamilyContributionAssignment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FamilyContributionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyContributionAssignment" ADD CONSTRAINT "FamilyContributionAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyContributionCycle" ADD CONSTRAINT "FamilyContributionCycle_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyContributionCycle" ADD CONSTRAINT "FamilyContributionCycle_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FamilyContributionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyContributionPayment" ADD CONSTRAINT "FamilyContributionPayment_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyContributionPayment" ADD CONSTRAINT "FamilyContributionPayment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FamilyContributionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyContributionPayment" ADD CONSTRAINT "FamilyContributionPayment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "FamilyContributionCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyContributionPayment" ADD CONSTRAINT "FamilyContributionPayment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
