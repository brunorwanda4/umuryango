-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('BORROWED', 'LENT');

-- CreateEnum
CREATE TYPE "LoanInterestType" AS ENUM ('NONE', 'FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "LoanRepaymentFrequency" AS ENUM ('ONCE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OVERDUE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoanApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoanRepaymentMethod" AS ENUM ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "LoanAuditAction" AS ENUM ('CREATED', 'UPDATED', 'SUBMITTED_FOR_APPROVAL', 'APPROVED', 'CANCELLED', 'COMPLETED', 'DELETED', 'REPAYMENT_CREATED', 'REPAYMENT_UPDATED', 'REPAYMENT_DELETED', 'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'STATUS_UPDATED');

-- CreateTable
CREATE TABLE "FamilyLoan" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "loanType" "LoanType" NOT NULL,
    "principalAmountMinorUnits" BIGINT NOT NULL,
    "interestRate" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "interestType" "LoanInterestType" NOT NULL DEFAULT 'NONE',
    "totalExpectedAmountMinorUnits" BIGINT NOT NULL,
    "paidAmountMinorUnits" BIGINT NOT NULL DEFAULT 0,
    "remainingBalanceMinorUnits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "borrowerName" TEXT,
    "borrowerMemberId" TEXT,
    "lenderName" TEXT,
    "lenderMemberId" TEXT,
    "categoryId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "repaymentFrequency" "LoanRepaymentFrequency" NOT NULL DEFAULT 'ONCE',
    "status" "LoanStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "LoanApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "idempotencyKey" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyLoanRepayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "amountMinorUnits" BIGINT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "LoanRepaymentMethod" NOT NULL DEFAULT 'CASH',
    "paidByMemberId" TEXT,
    "receivedByMemberId" TEXT,
    "receiptId" TEXT,
    "notes" TEXT,
    "idempotencyKey" TEXT,
    "createdById" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyLoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyLoanDocument" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyLoanDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyLoanAuditLog" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "action" "LoanAuditAction" NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "description" TEXT,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyLoanAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FamilyLoan_familyId_idempotencyKey_key" ON "FamilyLoan"("familyId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "FamilyLoan_familyId_status_idx" ON "FamilyLoan"("familyId", "status");

-- CreateIndex
CREATE INDEX "FamilyLoan_familyId_approvalStatus_idx" ON "FamilyLoan"("familyId", "approvalStatus");

-- CreateIndex
CREATE INDEX "FamilyLoan_familyId_dueDate_idx" ON "FamilyLoan"("familyId", "dueDate");

-- CreateIndex
CREATE INDEX "FamilyLoan_familyId_loanType_idx" ON "FamilyLoan"("familyId", "loanType");

-- CreateIndex
CREATE INDEX "FamilyLoan_familyId_categoryId_idx" ON "FamilyLoan"("familyId", "categoryId");

-- CreateIndex
CREATE INDEX "FamilyLoan_borrowerMemberId_idx" ON "FamilyLoan"("borrowerMemberId");

-- CreateIndex
CREATE INDEX "FamilyLoan_lenderMemberId_idx" ON "FamilyLoan"("lenderMemberId");

-- CreateIndex
CREATE INDEX "FamilyLoan_createdById_idx" ON "FamilyLoan"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyLoanRepayment_familyId_idempotencyKey_key" ON "FamilyLoanRepayment"("familyId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "FamilyLoanRepayment_familyId_paymentDate_idx" ON "FamilyLoanRepayment"("familyId", "paymentDate");

-- CreateIndex
CREATE INDEX "FamilyLoanRepayment_loanId_deletedAt_idx" ON "FamilyLoanRepayment"("loanId", "deletedAt");

-- CreateIndex
CREATE INDEX "FamilyLoanRepayment_paidByMemberId_idx" ON "FamilyLoanRepayment"("paidByMemberId");

-- CreateIndex
CREATE INDEX "FamilyLoanRepayment_receivedByMemberId_idx" ON "FamilyLoanRepayment"("receivedByMemberId");

-- CreateIndex
CREATE INDEX "FamilyLoanRepayment_receiptId_idx" ON "FamilyLoanRepayment"("receiptId");

-- CreateIndex
CREATE INDEX "FamilyLoanDocument_loanId_deletedAt_idx" ON "FamilyLoanDocument"("loanId", "deletedAt");

-- CreateIndex
CREATE INDEX "FamilyLoanDocument_uploadedById_idx" ON "FamilyLoanDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "FamilyLoanAuditLog_loanId_createdAt_idx" ON "FamilyLoanAuditLog"("loanId", "createdAt");

-- CreateIndex
CREATE INDEX "FamilyLoanAuditLog_performedById_idx" ON "FamilyLoanAuditLog"("performedById");

-- AddForeignKey
ALTER TABLE "FamilyLoan" ADD CONSTRAINT "FamilyLoan_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoan" ADD CONSTRAINT "FamilyLoan_borrowerMemberId_fkey" FOREIGN KEY ("borrowerMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoan" ADD CONSTRAINT "FamilyLoan_lenderMemberId_fkey" FOREIGN KEY ("lenderMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoan" ADD CONSTRAINT "FamilyLoan_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FamilyTransactionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoan" ADD CONSTRAINT "FamilyLoan_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoan" ADD CONSTRAINT "FamilyLoan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoan" ADD CONSTRAINT "FamilyLoan_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoanRepayment" ADD CONSTRAINT "FamilyLoanRepayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "FamilyLoan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoanRepayment" ADD CONSTRAINT "FamilyLoanRepayment_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoanRepayment" ADD CONSTRAINT "FamilyLoanRepayment_paidByMemberId_fkey" FOREIGN KEY ("paidByMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoanRepayment" ADD CONSTRAINT "FamilyLoanRepayment_receivedByMemberId_fkey" FOREIGN KEY ("receivedByMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoanRepayment" ADD CONSTRAINT "FamilyLoanRepayment_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "FamilyReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoanRepayment" ADD CONSTRAINT "FamilyLoanRepayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoanDocument" ADD CONSTRAINT "FamilyLoanDocument_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "FamilyLoan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoanDocument" ADD CONSTRAINT "FamilyLoanDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoanAuditLog" ADD CONSTRAINT "FamilyLoanAuditLog_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "FamilyLoan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLoanAuditLog" ADD CONSTRAINT "FamilyLoanAuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
