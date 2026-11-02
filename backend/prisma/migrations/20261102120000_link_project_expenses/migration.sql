ALTER TYPE "FamilyProjectContributionStrategy" ADD VALUE 'CURRENT_BALANCE';

ALTER TABLE "FamilyTransaction"
ADD COLUMN "projectId" TEXT;

CREATE INDEX "FamilyTransaction_familyId_projectId_status_idx"
ON "FamilyTransaction"("familyId", "projectId", "status");

ALTER TABLE "FamilyTransaction"
ADD CONSTRAINT "FamilyTransaction_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "FamilyProject"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
