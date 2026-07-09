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
    receivedFromContactId: 'contact-1',
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
      familyContact: { findFirst: jest.fn() },
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
    prisma.familyContact.findFirst.mockResolvedValue({
      id: 'contact-1',
      fullName: 'Jean Tenant',
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
      receivedFromContactId: 'contact-1',
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
          receivedFromContactId: 'contact-1',
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
            receivedFromContactId: 'contact-1',
          }),
        }),
      }),
    );
  });

  it('records a partial payment against monthly income without changing the source schedule', async () => {
    const source = makeTransaction({
      id: 'source-rent-july',
      amountMinorUnits: 0n,
      expectedAmountMinorUnits: 350000n,
      paymentStatus: IncomePaymentStatus.UNPAID,
      dueDate: new Date('2026-07-20T00:00:00.000Z'),
      periodStart: new Date('2026-07-01T00:00:00.000Z'),
      periodEnd: new Date('2026-07-31T00:00:00.000Z'),
    });
    const created = makeTransaction({
      id: 'payment-rent-july-1',
      amountMinorUnits: 150000n,
      expectedAmountMinorUnits: 350000n,
      paymentStatus: IncomePaymentStatus.PARTIAL,
      date: new Date('2026-07-15T00:00:00.000Z'),
      dueDate: source.dueDate,
      periodStart: source.periodStart,
      periodEnd: source.periodEnd,
    });
    prisma.familyMember.findFirst.mockResolvedValue(managerMembership);
    prisma.familyTransaction.findFirst.mockResolvedValue(source);
    prisma.familyTransaction.findUnique.mockResolvedValue(null);
    prisma.familyTransaction.create.mockResolvedValue(created);
    prisma.familyAuditEvent.create.mockResolvedValue({ id: 'audit-payment-1' });

    const result = await service.recordIncomePayment(
      'user-1',
      'family-1',
      'source-rent-july',
      {
        amountMinorUnits: '150000',
        date: '2026-07-15T00:00:00.000Z',
        paymentMethod: 'MOBILE_MONEY',
        receivedBy: 'Family Treasurer',
        notes: 'Tenant paid before due date.',
        idempotencyKey: 'rent-july-payment-1',
      },
    );

    expect(result.amountMinorUnits).toBe('150000');
    expect(result.expectedAmountMinorUnits).toBe('350000');
    expect(result.paymentStatus).toBe(IncomePaymentStatus.PARTIAL);
    expect(prisma.familyTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categoryId: source.categoryId,
          amountMinorUnits: 150000n,
          currency: source.currency,
          type: TransactionType.INCOME,
          description: source.description,
          receivedFrom: source.receivedFrom,
          receivedFromContactId: source.receivedFromContactId,
          incomeRecurrence: IncomeRecurrence.MONTHLY,
          expectedAmountMinorUnits: 350000n,
          dueDate: new Date('2026-07-20T00:00:00.000Z'),
          periodStart: new Date('2026-07-01T00:00:00.000Z'),
          periodEnd: new Date('2026-07-31T00:00:00.000Z'),
          propertyName: source.propertyName,
          paymentStatus: IncomePaymentStatus.PARTIAL,
        }),
      }),
    );
    expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: FamilyAuditAction.TRANSACTION_CREATED,
          after: expect.objectContaining({
            sourceTransactionId: 'source-rent-july',
            amountMinorUnits: '150000',
            expectedAmountMinorUnits: '350000',
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
