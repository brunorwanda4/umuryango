import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ContributionCycleStatus,
  ContributionPaymentStatus,
  FamilyAuthority,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MoneyService } from './money.service';

const membership = {
  id: 'mem-1',
  familyId: 'fam-1',
  userId: 'u-1',
  authority: FamilyAuthority.HEAD,
  capabilities: [],
  family: { id: 'fam-1', defaultCurrency: 'RWF' },
};

const makePayment = ({
  id,
  amount,
  status,
}: {
  id: string;
  amount: bigint;
  status: ContributionPaymentStatus;
}) => ({
  id,
  amountMinorUnits: amount,
  status,
  paidAt: new Date(),
  createdAt: new Date(),
  member: { user: { fullName: 'Claudine Mutesi' } },
  plan: { name: 'Monthly dues' },
});

const makeTransaction = ({
  id,
  amount,
  type,
  status = TransactionStatus.PENDING,
}: {
  id: string;
  amount: bigint;
  type: TransactionType;
  status?: TransactionStatus;
}) => ({
  id,
  amountMinorUnits: amount,
  type,
  status,
  date: new Date(),
  createdAt: new Date(),
  description: null,
  category: { name: type === TransactionType.INCOME ? 'Salary' : 'Food' },
  createdBy: { fullName: 'Claudine Mutesi' },
});

describe('MoneyService', () => {
  let service: MoneyService;
  let prisma: {
    familyMember: { findFirst: jest.Mock };
    familyContributionPayment: { findMany: jest.Mock; count: jest.Mock };
    familyContributionCycle: { findMany: jest.Mock };
    familyTransaction: { findMany: jest.Mock; count: jest.Mock };
    familyBudget: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      familyMember: { findFirst: jest.fn() },
      familyContributionPayment: { findMany: jest.fn(), count: jest.fn() },
      familyContributionCycle: { findMany: jest.fn() },
      familyTransaction: { findMany: jest.fn(), count: jest.fn() },
      familyBudget: { findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [MoneyService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(MoneyService);
  });

  it('throws NotFound when the user is not a member', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(null);

    await expect(
      service.getOverview('stranger', 'fam-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('aggregates contributions and leaves unmodelled ledgers null', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(membership);
    prisma.familyContributionPayment.findMany.mockResolvedValue([
      makePayment({
        id: 'pay-1',
        amount: 5000n,
        status: ContributionPaymentStatus.VERIFIED,
      }),
      makePayment({
        id: 'pay-2',
        amount: 3000n,
        status: ContributionPaymentStatus.PENDING,
      }),
    ]);
    prisma.familyContributionCycle.findMany.mockResolvedValue([
      {
        status: ContributionCycleStatus.OPEN,
        dueDate: new Date('2000-01-01T00:00:00.000Z'),
      },
    ]);
    prisma.familyContributionPayment.count.mockResolvedValue(2);
    prisma.familyTransaction.findMany.mockResolvedValue([]);
    prisma.familyTransaction.count.mockResolvedValue(0);
    prisma.familyBudget.findMany.mockResolvedValue([]);

    const result = (await service.getOverview('u-1', 'fam-1')) as {
      currency: string;
      sourceRecordCount: number;
      totals: Record<string, unknown>;
      allocation: unknown[];
      approvals: unknown[];
      records: unknown[];
      cashFlow: unknown[];
      budgets: unknown[];
    };

    expect(result.currency).toBe('RWF');
    expect(result.sourceRecordCount).toBe(2);
    // Only the verified payment counts toward money paid.
    expect(result.totals.contributionsPaidMinorUnits).toBe('5000');
    expect(result.totals.pendingApprovalCount).toBe(2);
    // Past-due open cycle is overdue.
    expect(result.totals.overdueCount).toBe(1);
    // Cash balance and transaction values are now calculated and not null
    expect(result.totals.cashBalanceMinorUnits).toBe('5000');
    expect(result.totals.incomeMinorUnits).toBe('0');
    expect(result.totals.expenseMinorUnits).toBe('0');
    expect(result.totals.savingsMinorUnits).toBeNull();
    expect(result.totals.debtOutstandingMinorUnits).toBeNull();

    expect(result.allocation).toEqual([
      { label: 'Contributions', amountMinorUnits: '5000' },
    ]);
    // The pending payment surfaces as an approval item.
    expect(result.approvals).toHaveLength(1);
    expect(result.records).toHaveLength(2);
    expect(result.cashFlow).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          expenseMinorUnits: '0',
          incomeMinorUnits: expect.any(String),
          label: expect.any(String),
        }),
      ]),
    );
    expect(result.budgets).toEqual([]);
  });

  it('defaults the period to the current month', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(membership);
    prisma.familyContributionPayment.findMany.mockResolvedValue([]);
    prisma.familyContributionCycle.findMany.mockResolvedValue([]);
    prisma.familyContributionPayment.count.mockResolvedValue(0);
    prisma.familyTransaction.findMany.mockResolvedValue([]);
    prisma.familyTransaction.count.mockResolvedValue(0);
    prisma.familyBudget.findMany.mockResolvedValue([]);

    const result = (await service.getOverview('u-1', 'fam-1', 'bogus')) as {
      period: { label: string };
    };

    expect(result.period.label).toBe('This month');
  });

  it('includes pending saved transactions in dashboard totals', async () => {
    const income = makeTransaction({
      id: 'tx-income',
      amount: 2000n,
      type: TransactionType.INCOME,
    });
    const expense = makeTransaction({
      id: 'tx-expense',
      amount: 500n,
      type: TransactionType.EXPENSE,
    });

    prisma.familyMember.findFirst.mockResolvedValue(membership);
    prisma.familyContributionPayment.findMany.mockResolvedValue([]);
    prisma.familyContributionCycle.findMany.mockResolvedValue([]);
    prisma.familyContributionPayment.count.mockResolvedValue(0);
    prisma.familyTransaction.findMany
      .mockResolvedValueOnce([income])
      .mockResolvedValueOnce([expense])
      .mockResolvedValueOnce([income, expense])
      .mockResolvedValueOnce([income, expense]);
    prisma.familyTransaction.count.mockResolvedValue(2);
    prisma.familyBudget.findMany.mockResolvedValue([]);

    const result = (await service.getOverview('u-1', 'fam-1')) as {
      sourceRecordCount: number;
      totals: Record<string, unknown>;
      approvals: unknown[];
      records: unknown[];
    };

    expect(result.totals.incomeMinorUnits).toBe('2000');
    expect(result.totals.expenseMinorUnits).toBe('500');
    expect(result.totals.cashBalanceMinorUnits).toBe('1500');
    expect(result.totals.pendingApprovalCount).toBe(2);
    expect(result.sourceRecordCount).toBe(2);
    expect(result.approvals).toHaveLength(2);
    expect(result.records).toHaveLength(2);
  });
});
