import { NotFoundException } from '@nestjs/common';
import {
  PersonGoalProgressMethod,
  PersonPlanStatus,
  PersonPlanType,
} from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { PersonalPlansService } from './personal-plans.service';

const now = new Date('2026-07-12T10:00:00.000Z');

function plan(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plan-1',
    personId: 'person-1',
    createdById: 'person-1',
    type: PersonPlanType.LONG_TERM_GOAL,
    title: 'Buy a car',
    description: null,
    status: PersonPlanStatus.IN_PROGRESS,
    priority: null,
    startDate: now,
    dueDate: null,
    dueTime: null,
    targetDate: new Date('2027-07-12T00:00:00.000Z'),
    reminderAt: null,
    reminderFrequency: null,
    note: null,
    goalCategory: null,
    goalIcon: null,
    needsMoney: true,
    targetAmountMinorUnits: BigInt(20_000_000),
    currentAmountMinorUnits: BigInt(25_000_000),
    currency: 'RWF',
    progressMethod: PersonGoalProgressMethod.FINANCIAL,
    completedAt: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    milestones: [],
    ...overrides,
  };
}

describe('PersonalPlansService', () => {
  it('lists only records scoped to the authenticated person and clamps progress', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'person-1',
          fullName: 'Jean Example',
          phoneNumber: null,
          avatarUrl: null,
        }),
      },
      personPlan: { findMany: jest.fn().mockResolvedValue([plan()]) },
    };
    const service = new PersonalPlansService(
      prisma as unknown as PrismaService,
    );

    const result = await service.list('person-1');

    expect(prisma.personPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { personId: 'person-1', deletedAt: null },
      }),
    );
    expect(result.plans[0]).toEqual(
      expect.objectContaining({
        personId: 'person-1',
        progress: 100,
        targetAmountMinorUnits: '20000000',
      }),
    );
  });

  it('does not update a plan owned by another person', async () => {
    const prisma = {
      personPlan: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    };
    const service = new PersonalPlansService(
      prisma as unknown as PrismaService,
    );

    await expect(
      service.update('person-2', 'plan-1', { title: 'Changed' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.personPlan.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'plan-1', personId: 'person-2', deletedAt: null },
      }),
    );
    expect(prisma.personPlan.update).not.toHaveBeenCalled();
  });
});
