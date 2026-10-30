ALTER TABLE "Family" ADD COLUMN "personalOwnerId" TEXT;

CREATE UNIQUE INDEX "Family_personalOwnerId_key" ON "Family"("personalOwnerId");

ALTER TABLE "Family"
ADD CONSTRAINT "Family_personalOwnerId_fkey"
FOREIGN KEY ("personalOwnerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
