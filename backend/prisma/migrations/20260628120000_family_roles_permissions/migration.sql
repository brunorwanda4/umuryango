-- CreateEnum
CREATE TYPE "FamilyType" AS ENUM ('NUCLEAR', 'JOINT_EXTENDED', 'SINGLE_PARENT', 'BLENDED', 'ADOPTIVE');

-- CreateEnum
CREATE TYPE "FamilyAuthority" AS ENUM ('HEAD', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "FamilyCapability" AS ENUM ('MANAGE_FAMILY_SETTINGS', 'MANAGE_MEMBERS', 'MANAGE_SAVINGS', 'MANAGE_CONTRIBUTIONS', 'RECORD_INCOME', 'RECORD_EXPENSE', 'APPROVE_EXPENSE', 'MANAGE_DEBTS', 'MANAGE_PROJECTS', 'MANAGE_EVENTS', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_DOCUMENTS', 'VIEW_REPORTS', 'EXPORT_REPORTS');

-- CreateEnum
CREATE TYPE "FamilyKinship" AS ENUM ('SON', 'DAUGHTER', 'FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'UNCLE', 'AUNT', 'GRANDFATHER', 'GRANDMOTHER', 'COUSIN', 'IN_LAW', 'FAMILY_FRIEND', 'NEIGHBOR', 'CLEANER', 'OTHER');

-- CreateEnum
CREATE TYPE "FamilyAuditAction" AS ENUM ('MEMBER_INVITED', 'MEMBER_REMOVED', 'AUTHORITY_CHANGED', 'CAPABILITIES_CHANGED', 'HEAD_GRANTED', 'SETTINGS_CHANGED');

-- AlterTable
ALTER TABLE "Family" ADD COLUMN "type" "FamilyType" NOT NULL DEFAULT 'NUCLEAR';

-- AlterTable
ALTER TABLE "FamilyMember" ADD COLUMN "authority" "FamilyAuthority" NOT NULL DEFAULT 'MEMBER';
ALTER TABLE "FamilyMember" ADD COLUMN "kinshipLabel" "FamilyKinship";
ALTER TABLE "FamilyMember" ADD COLUMN "kinshipCustom" TEXT;
ALTER TABLE "FamilyMember" ADD COLUMN "capabilities" "FamilyCapability"[] NOT NULL DEFAULT ARRAY[]::"FamilyCapability"[];
ALTER TABLE "FamilyMember" ADD COLUMN "removedAt" TIMESTAMP(3);
UPDATE "FamilyMember"
SET "authority" = CASE "role"::text
  WHEN 'OWNER' THEN 'HEAD'::"FamilyAuthority"
  WHEN 'ADMIN' THEN 'ADMIN'::"FamilyAuthority"
  ELSE 'MEMBER'::"FamilyAuthority"
END;
ALTER TABLE "FamilyMember" ALTER COLUMN "capabilities" DROP DEFAULT;
ALTER TABLE "FamilyMember" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "FamilyInvite" ADD COLUMN "authority" "FamilyAuthority" NOT NULL DEFAULT 'MEMBER';
ALTER TABLE "FamilyInvite" ADD COLUMN "kinshipLabel" "FamilyKinship";
ALTER TABLE "FamilyInvite" ADD COLUMN "kinshipCustom" TEXT;
ALTER TABLE "FamilyInvite" ADD COLUMN "capabilities" "FamilyCapability"[] NOT NULL DEFAULT ARRAY[]::"FamilyCapability"[];
UPDATE "FamilyInvite"
SET "authority" = CASE "role"::text
  WHEN 'OWNER' THEN 'HEAD'::"FamilyAuthority"
  WHEN 'ADMIN' THEN 'ADMIN'::"FamilyAuthority"
  ELSE 'MEMBER'::"FamilyAuthority"
END;
ALTER TABLE "FamilyInvite" ALTER COLUMN "capabilities" DROP DEFAULT;
ALTER TABLE "FamilyInvite" DROP COLUMN "role";

-- DropEnum
DROP TYPE "FamilyMemberRole";

-- CreateTable
CREATE TABLE "FamilyAuditEvent" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "FamilyAuditAction" NOT NULL,
    "targetMemberId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FamilyAuditEvent_familyId_createdAt_idx" ON "FamilyAuditEvent"("familyId", "createdAt");

-- AddForeignKey
ALTER TABLE "FamilyAuditEvent" ADD CONSTRAINT "FamilyAuditEvent_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
