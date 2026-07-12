ALTER TABLE "FamilyTransactionCategory"
ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'FAMILY',
ADD COLUMN "ownerId" TEXT;

ALTER TABLE "FamilyTransactionCategory"
ADD CONSTRAINT "FamilyTransactionCategory_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "FamilyTransactionCategory_familyId_scope_ownerId_type_status_idx"
ON "FamilyTransactionCategory"("familyId", "scope", "ownerId", "type", "status");

CREATE UNIQUE INDEX "FamilyTransactionCategory_familyId_scope_ownerId_type_name_key"
ON "FamilyTransactionCategory"("familyId", "scope", "ownerId", "type", "name");

ALTER TABLE "FamilyTransactionCategory"
ADD CONSTRAINT "FamilyTransactionCategory_scope_owner_check"
CHECK (
  ("scope" = 'FAMILY' AND "ownerId" IS NULL)
  OR ("scope" = 'PERSONAL' AND "ownerId" IS NOT NULL)
);
