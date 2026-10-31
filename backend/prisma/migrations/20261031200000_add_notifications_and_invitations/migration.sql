-- AlterEnum
ALTER TYPE "FamilyInviteStatus" ADD VALUE IF NOT EXISTS 'DECLINED';

-- AlterEnum
ALTER TYPE "FamilyAuditAction" ADD VALUE IF NOT EXISTS 'INVITATION_ACCEPTED';
ALTER TYPE "FamilyAuditAction" ADD VALUE IF NOT EXISTS 'INVITATION_DECLINED';

-- AlterTable
ALTER TABLE "FamilyInvite" ADD COLUMN "invitedById" TEXT;

-- CreateIndex
CREATE INDEX "FamilyInvite_invitedById_idx" ON "FamilyInvite"("invitedById");

-- AddForeignKey
ALTER TABLE "FamilyInvite" ADD CONSTRAINT "FamilyInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FAMILY_INVITE', 'TRANSACTION_APPROVED', 'TRANSACTION_REJECTED', 'CONTRIBUTION_VERIFIED', 'CONTRIBUTION_REVERSED', 'SYSTEM');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_familyId_idx" ON "Notification"("familyId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
