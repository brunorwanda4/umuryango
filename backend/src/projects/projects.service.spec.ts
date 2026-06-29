import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  FamilyProjectCategory,
  FamilyProjectContributionStatus,
  FamilyProjectContributionStrategy,
  FamilyProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

const baseDate = new Date('2026-06-29T12:00:00.000Z');

const membership = {
  id: 'mem-1',
  familyId: 'fam-1',
  userId: 'u-1',
  authority: FamilyAuthority.HEAD,
  capabilities: [],
  family: { id: 'fam-1', defaultCurrency: 'RWF' },
};

const makeProject = ({
  id,
  targetAmountMinorUnits,
  targetDate,
}: {
  id: string;
  targetAmountMinorUnits: bigint;
  targetDate: Date;
}) => ({
  id,
  familyId: 'fam-1',
  name: id === 'project-1' ? 'Build family house' : 'Buy family vehicle',
  category:
    id === 'project-1'
      ? FamilyProjectCategory.HOUSE
      : FamilyProjectCategory.VEHICLE,
  description: null,
  targetAmountMinorUnits,
  currency: 'RWF',
  startDate: null,
  targetDate,
  status: FamilyProjectStatus.ACTIVE,
  ownerMemberId: 'mem-1',
  contributionStrategy: FamilyProjectContributionStrategy.EQUAL_SHARES,
  expectedContributionMinorUnits: null,
  participantNotes: null,
  idempotencyKey: null,
  createdById: 'u-1',
  completedAt: null,
  archivedAt: null,
  createdAt: baseDate,
  updatedAt: baseDate,
  ownerMember: { user: { fullName: 'Claudine Mutesi' } },
  participants: [{ id: 'participant-1' }],
});

describe('ProjectsService', () => {
  let service: ProjectsService;
  type PrismaMock = {
    familyMember: { findFirst: jest.Mock; count: jest.Mock };
    familyProject: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    familyProjectContribution: { findMany: jest.Mock };
    familyProjectUpdate: { findMany: jest.Mock };
    familyAuditEvent: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  type TransactionCallback = (tx: PrismaMock) => unknown;
  type ProjectCreateArgs = {
    data: {
      familyId: string;
      ownerMemberId: string | null;
      idempotencyKey: string | null;
      targetAmountMinorUnits: bigint;
    };
  };
  type AuditCreateArgs = {
    data: { action: FamilyAuditAction; familyId: string };
  };
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = {
      familyMember: { findFirst: jest.fn(), count: jest.fn() },
      familyProject: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      familyProjectContribution: { findMany: jest.fn() },
      familyProjectUpdate: { findMany: jest.fn() },
      familyAuditEvent: { create: jest.fn() },
      $transaction: jest.fn((callback: TransactionCallback) =>
        callback(prisma),
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ProjectsService);
  });

  it('throws NotFound when the user is not a family member', async () => {
    prisma.familyMember.findFirst.mockResolvedValue(null);

    await expect(
      service.getOverview('stranger', 'fam-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('aggregates project overview from persisted rows only', async () => {
    const projects = [
      makeProject({
        id: 'project-1',
        targetAmountMinorUnits: 10000n,
        targetDate: new Date('2026-01-01T00:00:00.000Z'),
      }),
      makeProject({
        id: 'project-2',
        targetAmountMinorUnits: 5000n,
        targetDate: new Date('2099-01-01T00:00:00.000Z'),
      }),
    ];

    prisma.familyMember.findFirst.mockResolvedValue(membership);
    prisma.familyProject.findMany.mockResolvedValue(projects);
    prisma.familyProjectUpdate.findMany.mockResolvedValue([
      {
        id: 'update-1',
        title: 'Foundation complete',
        body: null,
        createdAt: baseDate,
        project: { name: 'Build family house' },
        createdBy: { fullName: 'Claudine Mutesi' },
      },
    ]);
    prisma.familyProjectContribution.findMany.mockResolvedValue([
      {
        id: 'contribution-1',
        projectId: 'project-1',
        memberId: 'mem-1',
        amountMinorUnits: 3000n,
        paidAt: baseDate,
        status: FamilyProjectContributionStatus.VERIFIED,
        project: { name: 'Build family house' },
        member: { user: { fullName: 'Claudine Mutesi' } },
      },
      {
        id: 'contribution-2',
        projectId: 'project-1',
        memberId: 'mem-2',
        amountMinorUnits: 2000n,
        paidAt: baseDate,
        status: FamilyProjectContributionStatus.PENDING,
        project: { name: 'Build family house' },
        member: { user: { fullName: 'Jean Mutesi' } },
      },
    ]);

    const result = (await service.getOverview('u-1', 'fam-1', 'active')) as {
      currency: string;
      sourceRecordCount: number;
      totals: Record<string, unknown>;
      projects: Array<Record<string, unknown>>;
      contributions: unknown[];
      updates: unknown[];
    };

    expect(result.currency).toBe('RWF');
    expect(result.sourceRecordCount).toBe(5);
    expect(result.totals.plannedMinorUnits).toBe('15000');
    expect(result.totals.contributedMinorUnits).toBe('3000');
    expect(result.totals.outstandingMinorUnits).toBe('12000');
    expect(result.totals.activeProjectCount).toBe(2);
    expect(result.totals.overdueProjectCount).toBe(1);
    expect(result.totals.contributorCount).toBe(1);
    expect(result.projects[0]).toEqual(
      expect.objectContaining({
        id: 'project-1',
        contributedMinorUnits: '3000',
        outstandingMinorUnits: '7000',
        ownerName: 'Claudine Mutesi',
        memberCount: 1,
      }),
    );
    expect(result.contributions).toHaveLength(2);
    expect(result.updates).toHaveLength(1);
  });

  it('blocks project creation without MANAGE_PROJECTS', async () => {
    prisma.familyMember.findFirst.mockResolvedValue({
      ...membership,
      authority: FamilyAuthority.MEMBER,
      capabilities: [],
    });

    await expect(
      service.create('u-1', 'fam-1', {
        name: 'Build family house',
        category: FamilyProjectCategory.HOUSE,
        targetAmountMinorUnits: '10000',
        targetDate: '2026-12-31',
        contributionStrategy: FamilyProjectContributionStrategy.EQUAL_SHARES,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates a project with an audit event', async () => {
    const created = makeProject({
      id: 'project-1',
      targetAmountMinorUnits: 10000n,
      targetDate: new Date('2026-12-31T00:00:00.000Z'),
    });

    prisma.familyMember.findFirst.mockResolvedValue({
      ...membership,
      capabilities: [FamilyCapability.MANAGE_PROJECTS],
    });
    prisma.familyProject.findUnique.mockResolvedValue(null);
    prisma.familyMember.count.mockResolvedValue(1);
    let projectCreateArgs: ProjectCreateArgs | undefined;
    let auditCreateArgs: AuditCreateArgs | undefined;
    prisma.familyProject.create.mockImplementation(
      (args: ProjectCreateArgs) => {
        projectCreateArgs = args;
        return Promise.resolve(created);
      },
    );
    prisma.familyAuditEvent.create.mockImplementation(
      (args: AuditCreateArgs) => {
        auditCreateArgs = args;
        return Promise.resolve({ id: 'audit-1' });
      },
    );

    const result = await service.create(
      'u-1',
      'fam-1',
      {
        name: 'Build family house',
        category: FamilyProjectCategory.HOUSE,
        targetAmountMinorUnits: '10000',
        targetDate: '2026-12-31',
        ownerMemberId: 'mem-1',
        contributionStrategy: FamilyProjectContributionStrategy.EQUAL_SHARES,
      },
      'idem-1',
    );

    expect(result.id).toBe('project-1');
    expect(result.status).toBe('active');
    expect(projectCreateArgs?.data.familyId).toBe('fam-1');
    expect(projectCreateArgs?.data.ownerMemberId).toBe('mem-1');
    expect(projectCreateArgs?.data.idempotencyKey).toBe('idem-1');
    expect(projectCreateArgs?.data.targetAmountMinorUnits).toBe(10000n);
    expect(auditCreateArgs?.data.action).toBe(
      FamilyAuditAction.PROJECT_CREATED,
    );
    expect(auditCreateArgs?.data.familyId).toBe('fam-1');
  });
});
