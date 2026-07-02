import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FamilyAuthority,
  FamilyCapability,
  LoanApprovalStatus,
  LoanAuditAction,
  LoanInterestType,
  LoanRepaymentFrequency,
  LoanRepaymentMethod,
  LoanStatus,
  LoanType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoansService } from './loans.service';

const baseDate = new Date('2026-07-01T12:00:00.000Z');

const managerMembership = {
  id: 'member-manager',
  userId: 'user-manager',
  authority: FamilyAuthority.ADMIN,
  capabilities: [FamilyCapability.MANAGE_DEBTS],
  family: { defaultCurrency: 'RWF' },
};

const memberMembership = {
  id: 'member-1',
  userId: 'user-1',
  authority: FamilyAuthority.MEMBER,
  capabilities: [],
  family: { defaultCurrency: 'RWF' },
};

function makeLoan(overrides: Record<string, unknown> = {}) {
  return {
    id: 'loan-1',
    familyId: 'family-1',
    title: 'School fees loan',
    description: null,
    loanType: LoanType.BORROWED,
    principalAmountMinorUnits: 100000n,
    interestRate: new Prisma.Decimal('10'),
    interestType: LoanInterestType.PERCENTAGE,
    totalExpectedAmountMinorUnits: 110000n,
    paidAmountMinorUnits: 0n,
    remainingBalanceMinorUnits: 110000n,
    currency: 'RWF',
    borrowerName: null,
    borrowerMemberId: 'member-1',
    borrowerContactId: null,
    lenderName: 'Aunt Grace',
    lenderMemberId: null,
    lenderContactId: null,
    categoryId: null,
    startDate: baseDate,
    dueDate: new Date('2026-12-31T00:00:00.000Z'),
    repaymentFrequency: LoanRepaymentFrequency.MONTHLY,
    status: LoanStatus.DRAFT,
    approvalStatus: LoanApprovalStatus.DRAFT,
    approvedById: null,
    approvedAt: null,
    createdById: 'user-1',
    updatedById: null,
    idempotencyKey: null,
    deletedAt: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    borrowerMember: { user: { fullName: 'Jean Mutesi' } },
    borrowerContact: null,
    lenderMember: null,
    lenderContact: null,
    category: null,
    createdBy: { fullName: 'Jean Mutesi' },
    updatedBy: null,
    approvedBy: null,
    _count: { repayments: 0, documents: 0, auditLogs: 1 },
    auditLogs: [],
    ...overrides,
  };
}

function makeRepayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'repayment-1',
    loanId: 'loan-1',
    familyId: 'family-1',
    amountMinorUnits: 40000n,
    paymentDate: new Date('2026-08-01T10:00:00.000Z'),
    paymentMethod: LoanRepaymentMethod.CASH,
    paidByMemberId: 'member-1',
    receivedByMemberId: null,
    receiptId: null,
    notes: null,
    idempotencyKey: null,
    createdById: 'user-1',
    deletedAt: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    paidByMember: { user: { fullName: 'Jean Mutesi' } },
    receivedByMember: null,
    receipt: null,
    createdBy: { fullName: 'Jean Mutesi' },
    ...overrides,
  };
}

describe('LoansService', () => {
  let service: LoansService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      familyMember: {
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      familyLoan: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      familyLoanRepayment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      familyContact: { findMany: jest.fn() },
      familyTransactionCategory: { findFirst: jest.fn() },
      familyReceipt: { findFirst: jest.fn() },
      familyLoanAuditLog: { create: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [LoansService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(LoansService);
  });

  it('creates a loan with calculated percentage interest and an audit log', async () => {
    const created = makeLoan();
    prisma.familyMember.findFirst.mockResolvedValue(managerMembership);
    prisma.familyLoan.create.mockResolvedValue(created);
    prisma.familyLoanAuditLog.create.mockResolvedValue({ id: 'audit-1' });

    const result = await service.createLoan('user-manager', 'family-1', {
      title: 'School fees loan',
      loanType: LoanType.BORROWED,
      principalAmountMinorUnits: '100000',
      interestRate: '10',
      interestType: LoanInterestType.PERCENTAGE,
      lenderName: 'Aunt Grace',
      startDate: '2026-07-01',
      dueDate: '2026-12-31',
      repaymentFrequency: LoanRepaymentFrequency.MONTHLY,
    });

    expect(result.totalExpectedAmountMinorUnits).toBe('110000');
    expect(prisma.familyLoan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          principalAmountMinorUnits: 100000n,
          totalExpectedAmountMinorUnits: 110000n,
          remainingBalanceMinorUnits: 110000n,
          currency: 'RWF',
        }),
      }),
    );
    expect(prisma.familyLoanAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: LoanAuditAction.CREATED,
          performedById: 'user-manager',
        }),
      }),
    );
  });

  it('scopes non-manager loan lists to records they own or participate in', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(memberMembership);
    prisma.familyLoan.updateMany.mockResolvedValue({ count: 0 });
    prisma.familyLoan.findMany.mockResolvedValue([]);
    prisma.familyLoan.count.mockResolvedValue(0);

    await service.findLoans('user-1', 'family-1', { page: 1, limit: 20 });

    expect(prisma.familyLoan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          familyId: 'family-1',
          deletedAt: null,
          OR: [
            { createdById: 'user-1' },
            { borrowerMemberId: 'member-1' },
            { lenderMemberId: 'member-1' },
          ],
        }),
      }),
    );
  });

  it('records repayment inside a transaction and recalculates loan balance', async () => {
    const approvedLoan = makeLoan({
      status: LoanStatus.ACTIVE,
      approvalStatus: LoanApprovalStatus.APPROVED,
    });
    const updatedLoan = makeLoan({
      status: LoanStatus.ACTIVE,
      approvalStatus: LoanApprovalStatus.APPROVED,
      paidAmountMinorUnits: 40000n,
      remainingBalanceMinorUnits: 70000n,
      _count: { repayments: 1, documents: 0, auditLogs: 2 },
    });
    const repayment = makeRepayment();

    prisma.familyMember.findFirst.mockResolvedValue(memberMembership);
    prisma.familyLoan.findFirst.mockResolvedValue(approvedLoan);
    prisma.familyMember.count.mockResolvedValue(1);
    prisma.familyLoanRepayment.create.mockResolvedValue(repayment);
    prisma.familyLoan.findUnique.mockResolvedValue(approvedLoan);
    prisma.familyLoanRepayment.findMany.mockResolvedValue([
      { amountMinorUnits: 40000n },
    ]);
    prisma.familyLoan.update.mockResolvedValue(updatedLoan);
    prisma.familyLoanAuditLog.create.mockResolvedValue({ id: 'audit-2' });

    const result = await service.addRepayment('user-1', 'family-1', 'loan-1', {
      amountMinorUnits: '40000',
      paymentDate: '2026-08-01T10:00:00.000Z',
      paymentMethod: LoanRepaymentMethod.CASH,
      paidByMemberId: 'member-1',
    });

    expect(result.loan.paidAmountMinorUnits).toBe('40000');
    expect(result.loan.remainingBalanceMinorUnits).toBe('70000');
    expect(prisma.familyLoan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmountMinorUnits: 40000n,
          remainingBalanceMinorUnits: 70000n,
          status: LoanStatus.ACTIVE,
        }),
      }),
    );
    expect(prisma.familyLoanAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: LoanAuditAction.REPAYMENT_CREATED,
        }),
      }),
    );
  });

  it('prevents marking a loan completed while a balance remains', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(managerMembership);
    prisma.familyLoan.findFirst.mockResolvedValue(
      makeLoan({
        status: LoanStatus.ACTIVE,
        approvalStatus: LoanApprovalStatus.APPROVED,
        remainingBalanceMinorUnits: 1n,
      }),
    );

    await expect(
      service.markCompleted('user-manager', 'family-1', 'loan-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
