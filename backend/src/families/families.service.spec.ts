import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FamilyMemberRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { FamiliesService } from './families.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const familyRecord = {
  id: 'fam-1',
  name: 'Mutesi Family',
  slug: 'mutesi-family',
  country: 'RW',
  defaultCurrency: 'RWF',
  contributionCadence: 'monthly',
  description: null,
  createdById: 'u-1',
  createdAt: new Date('2026-06-28T07:00:00.000Z'),
  updatedAt: new Date('2026-06-28T07:00:00.000Z'),
  members: [
    {
      id: 'mem-1',
      familyId: 'fam-1',
      userId: 'u-1',
      role: FamilyMemberRole.OWNER,
      createdAt: new Date('2026-06-28T07:00:00.000Z'),
      updatedAt: new Date('2026-06-28T07:00:00.000Z'),
      user: { fullName: 'Claudine Mutesi', avatarUrl: null },
    },
  ],
};

describe('FamiliesService.getBySlugForUser', () => {
  let service: FamiliesService;
  let prisma: { family: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = { family: { findUnique: jest.fn() } };

    const moduleRef = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(FamiliesService);
  });

  it('returns detail with the current user role for a member', async () => {
    prisma.family.findUnique.mockResolvedValue(familyRecord);

    const result = await service.getBySlugForUser('u-1', 'mutesi-family');

    expect(result.id).toBe('fam-1');
    expect(result.role).toBe(FamilyMemberRole.OWNER);
    expect(result.memberCount).toBe(1);
    expect(result.members).toEqual([
      {
        id: 'mem-1',
        userId: 'u-1',
        fullName: 'Claudine Mutesi',
        avatarUrl: null,
        role: FamilyMemberRole.OWNER,
        joinedAt: familyRecord.members[0].createdAt,
      },
    ]);
  });

  it('throws NotFound when the family does not exist', async () => {
    prisma.family.findUnique.mockResolvedValue(null);

    await expect(
      service.getBySlugForUser('u-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFound when the user is not a member (no existence leak)', async () => {
    prisma.family.findUnique.mockResolvedValue(familyRecord);

    await expect(
      service.getBySlugForUser('stranger', 'mutesi-family'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
