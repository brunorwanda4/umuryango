CREATE TABLE "FamilyContactDisplayName" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyContactDisplayName_pkey" PRIMARY KEY ("id")
);

ALTER TYPE "FamilyAuditAction" ADD VALUE IF NOT EXISTS 'CONTACT_IMPORTED';

CREATE UNIQUE INDEX "FamilyContactDisplayName_contactId_userId_key"
ON "FamilyContactDisplayName"("contactId", "userId");

CREATE INDEX "FamilyContactDisplayName_userId_idx"
ON "FamilyContactDisplayName"("userId");

ALTER TABLE "FamilyContactDisplayName"
ADD CONSTRAINT "FamilyContactDisplayName_contactId_fkey"
FOREIGN KEY ("contactId") REFERENCES "FamilyContact"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyContactDisplayName"
ADD CONSTRAINT "FamilyContactDisplayName_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
