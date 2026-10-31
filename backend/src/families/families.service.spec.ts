import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  FamilyType,
  TransactionType,
} from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { DEFAULT_MONEY_CATEGORIES } from '../money/default-categories';
import { PrismaService } from '../prisma/prisma.service';
import { FamiliesService } from './families.service';

const baseDate = new Date('2026-06-28T07:00:00.000Z');

const memberUser = {
  fullName: 'Claudine Mutesi',
  email: 'claudine@example.com',
  avatarUrl: null,
};

const makeMember = ({
  id,
  userId,
  authority,
  capabilities = [],
}: {
  id: string;
  userId: string;
  authority: FamilyAuthority;
  capabilities?: FamilyCapability[];
}) => ({
  id,
  familyId: 'fam-1',
  userId,
  authority,
  kinshipLabel: null,
  kinshipCustom: null,
  capabilities,
  removedAt: null,
  createdAt: baseDate,
  updatedAt: baseDate,
  user: memberUser,
});

const familyRecord = {
  id: 'fam-1',
  name: 'Mutesi Family',
  slug: 'mutesi-family',
  country: 'RW',
  defaultCurrency: 'RWF',
  contributionCadence: 'monthly',
  type: FamilyType.NUCLEAR,
  description: null,
  createdById: 'u-1',
  createdAt: baseDate,
  updatedAt: baseDate,
  members: [
    makeMember({
      id: 'mem-1',
      userId: 'u-1',
      authority: FamilyAuthority.HEAD,
    }),
  ],
};

describe('FamiliesService', () => {
  let service: FamiliesService;
  let prisma: {
    family: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      upsert: jest.Mock;
    };
    familyMember: { findMany: jest.Mock; update: jest.Mock };
    familyInvite: { upsert: jest.Mock };
    familyAuditEvent: { create: jest.Mock; findMany: jest.Mock };
    user: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let mail: { sendFamilyInvite: jest.Mock };

  beforeEach(async () => {
    prisma = {
      family: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      familyMember: { findMany: jest.fn(), update: jest.fn() },
      familyInvite: { upsert: jest.fn() },
      familyAuditEvent: { create: jest.fn(), findMany: jest.fn() },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };
    mail = { sendFamilyInvite: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'http://localhost:4914') },
        },
      ],
    }).compile();

    service = moduleRef.get(FamiliesService);
  });

  describe('create', () => {
    it('creates a family with default income and expense categories', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'aline@example.com',
        fullName: 'Aline Uwimana',
      });
      prisma.family.findUnique.mockResolvedValue(null);
      prisma.family.create.mockResolvedValue({
        ...familyRecord,
        invitedEmails: [],
      });

      await service.create('u-1', {
        name: 'Mutesi Family',
        country: 'RW',
        defaultCurrency: 'RWF',
        contributionCadence: 'monthly',
        type: FamilyType.NUCLEAR,
      });

      expect(prisma.family.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionCategories: {
              create: DEFAULT_MONEY_CATEGORIES,
            },
          }),
        }),
      );
      expect(DEFAULT_MONEY_CATEGORIES).toHaveLength(31);
      expect(DEFAULT_MONEY_CATEGORIES).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Food',
            type: TransactionType.EXPENSE,
          }),
          expect.objectContaining({
            name: 'School Fees',
            type: TransactionType.EXPENSE,
          }),
          expect.objectContaining({
            name: 'Salary',
            type: TransactionType.INCOME,
          }),
          expect.objectContaining({
            name: 'Family Contribution',
            type: TransactionType.INCOME,
          }),
          expect.objectContaining({
            name: 'Borrowed Money',
            type: TransactionType.INCOME,
          }),
          expect.objectContaining({
            name: 'Money Lent',
            type: TransactionType.EXPENSE,
          }),
        ]),
      );
    });
  });

  describe('getBySlugForUser', () => {
    it('returns detail with authority and capabilities for a member', async () => {
      prisma.family.findUnique.mockResolvedValue(familyRecord);

      const result = await service.getBySlugForUser('u-1', 'mutesi-family');

      expect(result.id).toBe('fam-1');
      expect(result.authority).toBe(FamilyAuthority.HEAD);
      expect(result.memberCount).toBe(1);
      expect(result.members).toEqual([
        {
          id: 'mem-1',
          userId: 'u-1',
          fullName: 'Claudine Mutesi',
          avatarUrl: null,
          authority: FamilyAuthority.HEAD,
          kinshipLabel: null,
          kinshipCustom: null,
          capabilities: [],
          joinedAt: baseDate,
        },
      ]);
    });

    it('throws NotFound when the family does not exist', async () => {
      prisma.family.findUnique.mockResolvedValue(null);

      await expect(
        service.getBySlugForUser('u-1', 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound when the user is not a member', async () => {
      prisma.family.findUnique.mockResolvedValue(familyRecord);

      await expect(
        service.getBySlugForUser('stranger', 'mutesi-family'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getOrCreatePersonalWorkspace', () => {
    it('creates a hidden personal workspace when the user has no family', async () => {
      prisma.family.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(familyRecord);
      prisma.familyMember.findMany.mockResolvedValue([]);
      prisma.family.upsert.mockResolvedValue({
        ...familyRecord,
        slug: 'personal-u-1',
        personalOwnerId: 'u-1',
      });

      const result = await service.getOrCreatePersonalWorkspace('u-1');

      expect(result.id).toBe('fam-1');
      expect(prisma.family.upsert).toHaveBeenCalledWith({
        where: { personalOwnerId: 'u-1' },
        update: {},
        create: expect.objectContaining({
          slug: 'personal-u-1',
          personalOwnerId: 'u-1',
          createdById: 'u-1',
        }),
      });
    });

    it('keeps personal workspaces out of the family list', async () => {
      prisma.familyMember.findMany.mockResolvedValue([]);

      await service.listForUser('u-1', 1);

      expect(prisma.familyMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'u-1',
            removedAt: null,
            family: { personalOwnerId: null },
          },
        }),
      );
    });
  });

  describe('inviteMember', () => {
    it('lets a HEAD invite a member and writes an audit event', async () => {
      prisma.family.findUnique.mockResolvedValue(familyRecord);

      const result = await service.inviteMember('u-1', 'mutesi-family', {
        email: 'new@example.com',
        authority: FamilyAuthority.MEMBER,
        capabilities: [],
      });

      expect(result).toEqual({
        email: 'new@example.com',
        authority: FamilyAuthority.MEMBER,
      });
      expect(prisma.familyInvite.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            familyId: 'fam-1',
            email: 'new@example.com',
            authority: FamilyAuthority.MEMBER,
          }),
        }),
      );
      expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: FamilyAuditAction.MEMBER_INVITED,
          }),
        }),
      );
      expect(mail.sendFamilyInvite).toHaveBeenCalled();
    });

    it('rejects a non-member inviter with 404', async () => {
      prisma.family.findUnique.mockResolvedValue(familyRecord);

      await expect(
        service.inviteMember('stranger', 'mutesi-family', {
          email: 'new@example.com',
          authority: FamilyAuthority.MEMBER,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('blocks a member without MANAGE_MEMBERS', async () => {
      prisma.family.findUnique.mockResolvedValue({
        ...familyRecord,
        members: [
          makeMember({
            id: 'mem-2',
            userId: 'u-2',
            authority: FamilyAuthority.MEMBER,
          }),
        ],
      });

      await expect(
        service.inviteMember('u-2', 'mutesi-family', {
          email: 'new@example.com',
          authority: FamilyAuthority.MEMBER,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('updateMember', () => {
    const familyWithMember = {
      ...familyRecord,
      members: [
        familyRecord.members[0],
        makeMember({
          id: 'mem-2',
          userId: 'u-2',
          authority: FamilyAuthority.MEMBER,
        }),
      ],
    };

    it('lets a HEAD update a member capability and kinship', async () => {
      prisma.family.findUnique.mockResolvedValue(familyWithMember);
      prisma.familyMember.update.mockResolvedValue({
        ...familyWithMember.members[1],
        kinshipLabel: 'COUSIN',
        capabilities: [FamilyCapability.VIEW_REPORTS],
      });

      const result = await service.updateMember(
        'u-1',
        'mutesi-family',
        'mem-2',
        {
          kinshipLabel: 'COUSIN',
          capabilities: [FamilyCapability.VIEW_REPORTS],
        },
      );

      expect(result.kinshipLabel).toBe('COUSIN');
      expect(result.capabilities).toEqual([FamilyCapability.VIEW_REPORTS]);
    });

    it('blocks demoting the last HEAD', async () => {
      prisma.family.findUnique.mockResolvedValue(familyRecord);

      await expect(
        service.updateMember('u-1', 'mutesi-family', 'mem-1', {
          authority: FamilyAuthority.MEMBER,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('removeMember', () => {
    it('lets a HEAD soft-remove a member', async () => {
      prisma.family.findUnique.mockResolvedValue({
        ...familyRecord,
        members: [
          familyRecord.members[0],
          makeMember({
            id: 'mem-2',
            userId: 'u-2',
            authority: FamilyAuthority.MEMBER,
          }),
        ],
      });

      const result = await service.removeMember(
        'u-1',
        'mutesi-family',
        'mem-2',
      );

      expect(result).toEqual({ id: 'mem-2' });
      expect(prisma.familyMember.update).toHaveBeenCalledWith({
        where: { id: 'mem-2' },
        data: { removedAt: expect.any(Date) },
      });
    });

    it('blocks removing the last HEAD', async () => {
      prisma.family.findUnique.mockResolvedValue(familyRecord);

      await expect(
        service.removeMember('u-1', 'mutesi-family', 'mem-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('grantHead', () => {
    it('lets a HEAD grant head to another member', async () => {
      const family = {
        ...familyRecord,
        members: [
          familyRecord.members[0],
          makeMember({
            id: 'mem-2',
            userId: 'u-2',
            authority: FamilyAuthority.MEMBER,
          }),
        ],
      };
      prisma.family.findUnique.mockResolvedValue(family);
      prisma.familyMember.update.mockResolvedValue({
        ...family.members[1],
        authority: FamilyAuthority.HEAD,
        capabilities: Object.values(FamilyCapability),
      });

      const result = await service.grantHead('u-1', 'mutesi-family', 'mem-2');

      expect(result.authority).toBe(FamilyAuthority.HEAD);
      expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: FamilyAuditAction.HEAD_GRANTED,
          }),
        }),
      );
    });

    it('blocks a non-HEAD from granting head', async () => {
      prisma.family.findUnique.mockResolvedValue({
        ...familyRecord,
        members: [
          makeMember({
            id: 'mem-1',
            userId: 'u-1',
            authority: FamilyAuthority.ADMIN,
            capabilities: [FamilyCapability.MANAGE_MEMBERS],
          }),
          makeMember({
            id: 'mem-2',
            userId: 'u-2',
            authority: FamilyAuthority.MEMBER,
          }),
        ],
      });

      await expect(
        service.grantHead('u-1', 'mutesi-family', 'mem-2'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('updateSettings', () => {
    it('lets a HEAD update settings', async () => {
      const updated = { ...familyRecord, name: 'Updated Family' };
      prisma.family.findUnique
        .mockResolvedValueOnce(familyRecord)
        .mockResolvedValueOnce(updated);

      const result = await service.updateSettings('u-1', 'mutesi-family', {
        name: 'Updated Family',
      });

      expect(result.name).toBe('Updated Family');
      expect(prisma.family.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'fam-1' },
          data: expect.objectContaining({ name: 'Updated Family' }),
        }),
      );
    });

    it('blocks a plain member without MANAGE_FAMILY_SETTINGS', async () => {
      prisma.family.findUnique.mockResolvedValue({
        ...familyRecord,
        members: [
          makeMember({
            id: 'mem-2',
            userId: 'u-2',
            authority: FamilyAuthority.MEMBER,
          }),
        ],
      });

      await expect(
        service.updateSettings('u-2', 'mutesi-family', {
          name: 'Updated Family',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('listAudit', () => {
    it('lets a HEAD read the audit log', async () => {
      prisma.family.findUnique.mockResolvedValue(familyRecord);
      prisma.familyAuditEvent.findMany.mockResolvedValue([
        {
          id: 'audit-1',
          action: FamilyAuditAction.MEMBER_INVITED,
          actorId: 'u-1',
          targetMemberId: null,
          createdAt: baseDate,
        },
      ]);

      const result = await service.listAudit('u-1', 'mutesi-family');

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe(FamilyAuditAction.MEMBER_INVITED);
    });

    it('blocks a plain member', async () => {
      prisma.family.findUnique.mockResolvedValue({
        ...familyRecord,
        members: [
          makeMember({
            id: 'mem-2',
            userId: 'u-2',
            authority: FamilyAuthority.MEMBER,
          }),
        ],
      });

      await expect(
        service.listAudit('u-2', 'mutesi-family'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getBySlugForUser', () => {
    it('identifies currentMember by the authenticated userId even when multiple members share the same authority', async () => {
      prisma.family.findUnique.mockResolvedValue({
        ...familyRecord,
        members: [
          {
            ...makeMember({
              id: 'mem-admin-1',
              userId: 'u-admin-1',
              authority: FamilyAuthority.ADMIN,
            }),
            user: {
              fullName: 'First Admin',
              email: 'admin1@example.com',
              avatarUrl: null,
            },
          },
          {
            ...makeMember({
              id: 'mem-admin-2',
              userId: 'u-admin-2',
              authority: FamilyAuthority.ADMIN,
            }),
            user: {
              fullName: 'Second Admin',
              email: 'admin2@example.com',
              avatarUrl: null,
            },
          },
        ],
      });

      const detail = await service.getBySlugForUser(
        'u-admin-2',
        'mutesi-family',
      );

      expect(detail.currentMember.id).toBe('mem-admin-2');
      expect(detail.currentMember.userId).toBe('u-admin-2');
      expect(detail.currentMember.fullName).toBe('Second Admin');
    });
  });
});
