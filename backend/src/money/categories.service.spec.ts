import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  CategoryStatus,
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  TransactionScope,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

const membership = {
  authority: FamilyAuthority.MEMBER,
  capabilities: [FamilyCapability.RECORD_INCOME],
};

const category = {
  id: 'category-1',
  familyId: 'family-1',
  name: 'Salary',
  type: TransactionType.INCOME,
  description: null,
  icon: null,
  color: null,
  status: CategoryStatus.ACTIVE,
  isDefault: false,
  scope: TransactionScope.FAMILY,
  ownerId: null,
  createdById: 'user-1',
  createdAt: new Date('2026-07-11T00:00:00.000Z'),
  updatedAt: new Date('2026-07-11T00:00:00.000Z'),
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      familyMember: { findFirst: jest.fn() },
      familyTransactionCategory: {
        create: jest.fn(),
        createMany: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      familyTransaction: { groupBy: jest.fn() },
      familyAuditEvent: { create: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(CategoriesService);
  });

  it('creates a dynamic income category and writes an audit event', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(membership);
    prisma.familyTransactionCategory.findFirst.mockResolvedValue(null);
    prisma.familyTransactionCategory.create.mockResolvedValue(category);

    await service.create(
      'family-1',
      { name: 'Salary', type: TransactionType.INCOME },
      'user-1',
    );

    expect(prisma.familyTransactionCategory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        familyId: 'family-1',
        createdById: 'user-1',
        type: TransactionType.INCOME,
      }),
    });
    expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: FamilyAuditAction.CATEGORY_CREATED,
        actorId: 'user-1',
      }),
    });
  });

  it('blocks category reads outside family membership', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(null);

    await expect(service.findAll('user-2', 'family-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('archives categories instead of deleting financial master data', async () => {
    prisma.familyMember.findFirst.mockResolvedValue({
      authority: FamilyAuthority.HEAD,
      capabilities: [],
    });
    prisma.familyTransactionCategory.findFirst.mockResolvedValue(category);
    prisma.familyTransactionCategory.update.mockResolvedValue({
      ...category,
      status: CategoryStatus.INACTIVE,
    });

    await service.remove('user-1', 'family-1', 'category-1');

    expect(prisma.familyTransactionCategory.update).toHaveBeenCalledWith({
      where: { id: 'category-1' },
      data: { status: CategoryStatus.INACTIVE },
    });
    expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: FamilyAuditAction.CATEGORY_ARCHIVED,
      }),
    });
  });

  it('provisions and returns personal defaults with personal usage totals', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(membership);
    prisma.familyTransactionCategory.createMany.mockResolvedValue({ count: 9 });
    prisma.familyTransactionCategory.findMany.mockResolvedValue([
      {
        ...category,
        ownerId: 'user-1',
        scope: TransactionScope.PERSONAL,
        createdBy: { fullName: 'Test User' },
      },
    ]);
    prisma.familyTransaction.groupBy.mockResolvedValue([
      {
        categoryId: category.id,
        _count: { _all: 2 },
        _sum: { amountMinorUnits: 250000n },
      },
    ]);

    const result = await service.findAllPersonal('user-1', 'family-1');

    expect(prisma.familyTransactionCategory.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          familyId: 'family-1',
          ownerId: 'user-1',
          scope: TransactionScope.PERSONAL,
          isDefault: true,
        }),
      ]),
      skipDuplicates: true,
    });
    expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: FamilyAuditAction.CATEGORY_CREATED,
        actorId: 'user-1',
      }),
    });
    expect(result[0]).toEqual(
      expect.objectContaining({
        createdByName: 'Test User',
        transactionsCount: 2,
        totalMinorUnits: '250000',
      }),
    );
  });

  it('does not allow access to another user personal category', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(membership);
    prisma.familyTransactionCategory.findFirst.mockResolvedValue(null);

    await expect(
      service.removePersonal('user-2', 'family-1', 'category-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.familyTransactionCategory.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'category-1',
        familyId: 'family-1',
        ownerId: 'user-2',
        scope: TransactionScope.PERSONAL,
      },
    });
  });
});
