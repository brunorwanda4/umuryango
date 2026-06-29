-- CreateEnum
CREATE TYPE "FamilyProjectCategory" AS ENUM ('HOUSE', 'VEHICLE', 'EDUCATION', 'BUSINESS', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FamilyProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FamilyProjectContributionStrategy" AS ENUM ('EQUAL_SHARES', 'PLEDGES', 'MONTHLY', 'AS_AVAILABLE');

-- CreateEnum
CREATE TYPE "FamilyProjectContributionStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'REVERSED');

-- AlterEnum
ALTER TYPE "FamilyAuditAction" ADD VALUE 'PROJECT_CREATED';
ALTER TYPE "FamilyAuditAction" ADD VALUE 'PROJECT_UPDATED';
ALTER TYPE "FamilyAuditAction" ADD VALUE 'PROJECT_CONTRIBUTION_RECORDED';
ALTER TYPE "FamilyAuditAction" ADD VALUE 'PROJECT_UPDATE_CREATED';

-- CreateTable
CREATE TABLE "FamilyProject" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FamilyProjectCategory" NOT NULL,
    "description" TEXT,
    "targetAmountMinorUnits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "FamilyProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerMemberId" TEXT,
    "contributionStrategy" "FamilyProjectContributionStrategy" NOT NULL,
    "expectedContributionMinorUnits" BIGINT,
    "participantNotes" TEXT,
    "idempotencyKey" TEXT,
    "createdById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyProjectParticipant" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "roleNotes" TEXT,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyProjectParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyProjectContribution" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amountMinorUnits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "FamilyProjectContributionStatus" NOT NULL DEFAULT 'PENDING',
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

    CONSTRAINT "FamilyProjectContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyProjectUpdate" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyProjectUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FamilyProject_familyId_status_idx" ON "FamilyProject"("familyId", "status");

-- CreateIndex
CREATE INDEX "FamilyProject_familyId_targetDate_idx" ON "FamilyProject"("familyId", "targetDate");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyProject_familyId_idempotencyKey_key" ON "FamilyProject"("familyId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "FamilyProject_ownerMemberId_idx" ON "FamilyProject"("ownerMemberId");

-- CreateIndex
CREATE INDEX "FamilyProject_createdById_idx" ON "FamilyProject"("createdById");

-- CreateIndex
CREATE INDEX "FamilyProjectParticipant_memberId_idx" ON "FamilyProjectParticipant"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyProjectParticipant_projectId_memberId_key" ON "FamilyProjectParticipant"("projectId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyProjectContribution_familyId_idempotencyKey_key" ON "FamilyProjectContribution"("familyId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "FamilyProjectContribution_familyId_status_paidAt_idx" ON "FamilyProjectContribution"("familyId", "status", "paidAt");

-- CreateIndex
CREATE INDEX "FamilyProjectContribution_projectId_paidAt_idx" ON "FamilyProjectContribution"("projectId", "paidAt");

-- CreateIndex
CREATE INDEX "FamilyProjectContribution_memberId_idx" ON "FamilyProjectContribution"("memberId");

-- CreateIndex
CREATE INDEX "FamilyProjectUpdate_familyId_createdAt_idx" ON "FamilyProjectUpdate"("familyId", "createdAt");

-- CreateIndex
CREATE INDEX "FamilyProjectUpdate_projectId_createdAt_idx" ON "FamilyProjectUpdate"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "FamilyProject" ADD CONSTRAINT "FamilyProject_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProject" ADD CONSTRAINT "FamilyProject_ownerMemberId_fkey" FOREIGN KEY ("ownerMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProject" ADD CONSTRAINT "FamilyProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProjectParticipant" ADD CONSTRAINT "FamilyProjectParticipant_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "FamilyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProjectParticipant" ADD CONSTRAINT "FamilyProjectParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProjectContribution" ADD CONSTRAINT "FamilyProjectContribution_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProjectContribution" ADD CONSTRAINT "FamilyProjectContribution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "FamilyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProjectContribution" ADD CONSTRAINT "FamilyProjectContribution_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProjectContribution" ADD CONSTRAINT "FamilyProjectContribution_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProjectContribution" ADD CONSTRAINT "FamilyProjectContribution_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProjectUpdate" ADD CONSTRAINT "FamilyProjectUpdate_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProjectUpdate" ADD CONSTRAINT "FamilyProjectUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "FamilyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyProjectUpdate" ADD CONSTRAINT "FamilyProjectUpdate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
