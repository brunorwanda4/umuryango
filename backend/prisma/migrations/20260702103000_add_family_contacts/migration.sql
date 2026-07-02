-- AlterEnum
ALTER TYPE "FamilyCapability" ADD VALUE IF NOT EXISTS 'MANAGE_CONTACTS';

-- AlterEnum
ALTER TYPE "FamilyAuditAction" ADD VALUE IF NOT EXISTS 'CONTACT_CREATED';
ALTER TYPE "FamilyAuditAction" ADD VALUE IF NOT EXISTS 'CONTACT_UPDATED';
ALTER TYPE "FamilyAuditAction" ADD VALUE IF NOT EXISTS 'CONTACT_DELETED';

-- CreateEnum
CREATE TYPE "FamilyContactType" AS ENUM ('RELATIVE', 'FAMILY_FRIEND', 'NEIGHBOR', 'EMERGENCY_CONTACT', 'DOCTOR', 'LAWYER', 'SCHOOL', 'CHURCH', 'BANK', 'SACCO', 'BUSINESS_PARTNER', 'LOAN_CONTACT', 'OTHER');

-- CreateEnum
CREATE TYPE "FamilyContactStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "FamilyContact" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "contactType" "FamilyContactType" NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "address" TEXT,
    "relationshipToFamily" TEXT,
    "organization" TEXT,
    "notes" TEXT,
    "isEmergencyContact" BOOLEAN NOT NULL DEFAULT false,
    "isLoanContact" BOOLEAN NOT NULL DEFAULT false,
    "status" "FamilyContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyContact_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "FamilyLoan" ADD COLUMN "borrowerContactId" TEXT;
ALTER TABLE "FamilyLoan" ADD COLUMN "lenderContactId" TEXT;

-- CreateIndex
CREATE INDEX "FamilyContact_familyId_status_idx" ON "FamilyContact"("familyId", "status");

-- CreateIndex
CREATE INDEX "FamilyContact_familyId_contactType_idx" ON "FamilyContact"("familyId", "contactType");

-- CreateIndex
CREATE INDEX "FamilyContact_familyId_isEmergencyContact_idx" ON "FamilyContact"("familyId", "isEmergencyContact");

-- CreateIndex
CREATE INDEX "FamilyContact_familyId_isLoanContact_idx" ON "FamilyContact"("familyId", "isLoanContact");

-- CreateIndex
CREATE INDEX "FamilyContact_createdById_idx" ON "FamilyContact"("createdById");

-- CreateIndex
CREATE INDEX "FamilyLoan_borrowerContactId_idx" ON "FamilyLoan"("borrowerContactId");

-- CreateIndex
CREATE INDEX "FamilyLoan_lenderContactId_idx" ON "FamilyLoan"("lenderContactId");

-- AddForeignKey
ALTER TABLE "FamilyContact" ADD CONSTRAINT "FamilyContact_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyContact" ADD CONSTRAINT "FamilyContact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoan" ADD CONSTRAINT "FamilyLoan_borrowerContactId_fkey" FOREIGN KEY ("borrowerContactId") REFERENCES "FamilyContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoan" ADD CONSTRAINT "FamilyLoan_lenderContactId_fkey" FOREIGN KEY ("lenderContactId") REFERENCES "FamilyContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
