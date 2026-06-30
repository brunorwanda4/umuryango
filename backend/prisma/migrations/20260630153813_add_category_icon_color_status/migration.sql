-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "FamilyTransactionCategory" ADD COLUMN     "color" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "FamilyTransactionCategory_familyId_status_idx" ON "FamilyTransactionCategory"("familyId", "status");

-- AddForeignKey
ALTER TABLE "FamilyTransactionCategory" ADD CONSTRAINT "FamilyTransactionCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
