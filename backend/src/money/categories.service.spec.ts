import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  CategoryStatus,
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
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
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
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
});
