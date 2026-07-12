CREATE TYPE "TransactionScope" AS ENUM ('FAMILY', 'PERSONAL');

ALTER TABLE "FamilyTransaction"
ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'FAMILY';

CREATE INDEX "FamilyTransaction_familyId_scope_type_date_idx"
ON "FamilyTransaction"("familyId", "scope", "type", "date");
