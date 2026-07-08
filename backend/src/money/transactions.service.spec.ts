import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  IncomePaymentStatus,
  IncomeRecurrence,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';

const baseDate = new Date('2026-07-08T12:00:00.000Z');

const managerMembership = {
  id: 'member-1',
  familyId: 'family-1',
  userId: 'user-1',
  authority: FamilyAuthority.ADMIN,
  capabilities: [FamilyCapability.RECORD_INCOME],
};

const plainMembership = {
  ...managerMembership,
  capabilities: [],
};

function makeTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tx-1',
    familyId: 'family-1',
    categoryId: 'category-rent',
    amountMinorUnits: 200000n,
    currency: 'RWF',
    type: TransactionType.INCOME,
    status: TransactionStatus.PENDING,
    incomeRecurrence: IncomeRecurrence.MONTHLY,
    paymentStatus: IncomePaymentStatus.PARTIAL,
    date: baseDate,
    description: 'July rent',
    paymentMethod: 'BANK_TRANSFER',
    idempotencyKey: 'idem-1',
    createdById: 'user-1',
    approvedById: null,
    approvedAt: null,
    reversedAt: null,
    notes: null,
    receivedFrom: 'Jean Tenant',
    receivedBy: 'Family Treasurer',
    expectedAmountMinorUnits: 300000n,
    dueDate: new Date('2026-07-05T00:00:00.000Z'),
    periodStart: new Date('2026-07-01T00:00:00.000Z'),
    periodEnd: new Date('2026-07-31T00:00:00.000Z'),
    propertyName: 'Kigali house',
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  };
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      familyMember: { findFirst: jest.fn() },
      familyTransactionCategory: { findFirst: jest.fn() },
      familyTransaction: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      familyAuditEvent: { create: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(TransactionsService);
  });

  it('creates monthly rental income with server-computed partial payment status', async () => {
    const created = makeTransaction();
    prisma.familyMember.findFirst.mockResolvedValue(managerMembership);
    prisma.familyTransactionCategory.findFirst.mockResolvedValue({
      id: 'category-rent',
    });
    prisma.familyTransaction.findUnique.mockResolvedValue(null);
    prisma.familyTransaction.create.mockResolvedValue(created);
    prisma.familyAuditEvent.create.mockResolvedValue({ id: 'audit-1' });

    const result = await service.create('user-1', 'family-1', {
      categoryId: 'category-rent',
      amountMinorUnits: '200000',
      currency: 'RWF',
      type: TransactionType.INCOME,
      date: '2026-07-08T12:00:00.000Z',
      description: 'July rent',
      paymentMethod: 'BANK_TRANSFER',
      idempotencyKey: 'idem-1',
      receivedFrom: 'Jean Tenant',
      receivedBy: 'Family Treasurer',
      incomeRecurrence: IncomeRecurrence.MONTHLY,
      expectedAmountMinorUnits: '300000',
      dueDate: '2026-07-05T00:00:00.000Z',
      periodStart: '2026-07-01T00:00:00.000Z',
      periodEnd: '2026-07-31T00:00:00.000Z',
      propertyName: 'Kigali house',
    });

    expect(result.amountMinorUnits).toBe('200000');
    expect(result.expectedAmountMinorUnits).toBe('300000');
    expect(result.paymentStatus).toBe(IncomePaymentStatus.PARTIAL);
    expect(prisma.familyTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountMinorUnits: 200000n,
          expectedAmountMinorUnits: 300000n,
          incomeRecurrence: IncomeRecurrence.MONTHLY,
          paymentStatus: IncomePaymentStatus.PARTIAL,
          dueDate: new Date('2026-07-05T00:00:00.000Z'),
          propertyName: 'Kigali house',
        }),
      }),
    );
    expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: FamilyAuditAction.TRANSACTION_CREATED,
          after: expect.objectContaining({
            expectedAmountMinorUnits: '300000',
            paymentStatus: IncomePaymentStatus.PARTIAL,
          }),
        }),
      }),
    );
  });

  it('blocks income creation without RECORD_INCOME capability', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(plainMembership);

    await expect(
      service.create('user-1', 'family-1', {
        categoryId: 'category-rent',
        amountMinorUnits: '200000',
        currency: 'RWF',
        type: TransactionType.INCOME,
        date: '2026-07-08T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects categories outside the family or transaction type', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(managerMembership);
    prisma.familyTransactionCategory.findFirst.mockResolvedValue(null);

    await expect(
      service.create('user-1', 'family-1', {
        categoryId: 'foreign-category',
        amountMinorUnits: '200000',
        currency: 'RWF',
        type: TransactionType.INCOME,
        date: '2026-07-08T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
