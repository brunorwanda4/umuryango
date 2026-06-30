-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FamilyAuditAction" ADD VALUE 'TRANSACTION_CREATED';
ALTER TYPE "FamilyAuditAction" ADD VALUE 'TRANSACTION_UPDATED';
ALTER TYPE "FamilyAuditAction" ADD VALUE 'TRANSACTION_APPROVED';
ALTER TYPE "FamilyAuditAction" ADD VALUE 'TRANSACTION_REJECTED';
ALTER TYPE "FamilyAuditAction" ADD VALUE 'TRANSACTION_REVERSED';

-- AlterTable
ALTER TABLE "FamilyTransaction" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "receivedBy" TEXT,
ADD COLUMN     "receivedFrom" TEXT;
