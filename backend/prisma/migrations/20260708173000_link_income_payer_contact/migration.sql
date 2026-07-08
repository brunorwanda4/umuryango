-- AlterTable
ALTER TABLE "FamilyTransaction" ADD COLUMN "receivedFromContactId" TEXT;

-- AddForeignKey
ALTER TABLE "FamilyTransaction"
ADD CONSTRAINT "FamilyTransaction_receivedFromContactId_fkey"
FOREIGN KEY ("receivedFromContactId") REFERENCES "FamilyContact"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "FamilyTransaction_familyId_receivedFromContactId_idx" ON "FamilyTransaction"("familyId", "receivedFromContactId");
