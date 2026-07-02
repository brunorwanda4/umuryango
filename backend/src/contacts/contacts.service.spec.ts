import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  FamilyContactStatus,
  FamilyContactType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContactsService } from './contacts.service';

const baseDate = new Date('2026-07-02T08:00:00.000Z');

const managerMembership = {
  id: 'member-manager',
  userId: 'user-manager',
  authority: FamilyAuthority.ADMIN,
  capabilities: [FamilyCapability.MANAGE_CONTACTS],
};

const memberMembership = {
  id: 'member-1',
  userId: 'user-1',
  authority: FamilyAuthority.MEMBER,
  capabilities: [],
};

function makeContact(overrides: Record<string, unknown> = {}) {
  return {
    id: 'contact-1',
    familyId: 'family-1',
    fullName: 'Aunt Grace',
    contactType: FamilyContactType.RELATIVE,
    phoneNumber: '+250788000000',
    email: null,
    address: null,
    relationshipToFamily: 'Aunt',
    organization: null,
    notes: null,
    isEmergencyContact: false,
    isLoanContact: true,
    status: FamilyContactStatus.ACTIVE,
    createdById: 'user-1',
    deletedAt: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    createdBy: { fullName: 'Jean Mutesi' },
    ...overrides,
  };
}

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      familyMember: { findFirst: jest.fn() },
      familyContact: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      familyAuditEvent: { create: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ContactsService);
  });

  it('creates a family contact and writes an audit event', async () => {
    const contact = makeContact();
    prisma.familyMember.findFirst.mockResolvedValue(memberMembership);
    prisma.familyContact.create.mockResolvedValue(contact);
    prisma.familyAuditEvent.create.mockResolvedValue({ id: 'audit-1' });

    const result = await service.create('user-1', 'family-1', {
      fullName: 'Aunt Grace',
      contactType: FamilyContactType.RELATIVE,
      phoneNumber: '+250788000000',
      relationshipToFamily: 'Aunt',
      isLoanContact: true,
    });

    expect(result.id).toBe('contact-1');
    expect(prisma.familyContact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          familyId: 'family-1',
          createdById: 'user-1',
          isLoanContact: true,
        }),
      }),
    );
    expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          familyId: 'family-1',
          actorId: 'user-1',
          action: FamilyAuditAction.CONTACT_CREATED,
        }),
      }),
    );
  });

  it('prevents non-creators from updating contacts without contact management', async () => {
    prisma.familyMember.findFirst.mockResolvedValue({
      ...memberMembership,
      userId: 'user-2',
    });
    prisma.familyContact.findFirst.mockResolvedValue(makeContact());

    await expect(
      service.update('user-2', 'family-1', 'contact-1', {
        fullName: 'Changed',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('soft deletes contacts and records the deletion audit', async () => {
    const contact = makeContact();
    const deleted = makeContact({ deletedAt: baseDate });
    prisma.familyMember.findFirst.mockResolvedValue(managerMembership);
    prisma.familyContact.findFirst.mockResolvedValue(contact);
    prisma.familyContact.update.mockResolvedValue(deleted);
    prisma.familyAuditEvent.create.mockResolvedValue({ id: 'audit-2' });

    const result = await service.delete(
      'user-manager',
      'family-1',
      'contact-1',
    );

    expect(result.deletedAt).toBe(baseDate.toISOString());
    expect(prisma.familyContact.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'contact-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
    expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: FamilyAuditAction.CONTACT_DELETED,
        }),
      }),
    );
  });
});
