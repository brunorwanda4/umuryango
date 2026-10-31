import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  FamilyAuditAction,
  FamilyAuthority,
  FamilyInviteStatus,
} from '@prisma/client';
import { InvitationsService } from './invitations.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
    familyInvite: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    familyMember: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    familyAuditEvent: {
      create: jest.Mock;
    };
    notification: {
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      familyInvite: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      familyMember: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      familyAuditEvent: {
        create: jest.fn(),
      },
      notification: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    service = new InvitationsService(prisma as any);
  });

  describe('listForUser', () => {
    it('matches normalized authenticated email and excludes tokenHash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: 'User.One@EXAMPLE.com',
      });
      prisma.familyInvite.updateMany.mockResolvedValue({ count: 0 });
      prisma.familyInvite.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          familyId: 'fam-1',
          email: 'user.one@example.com',
          status: FamilyInviteStatus.PENDING,
          family: { id: 'fam-1', name: 'Family One' },
        },
      ]);

      const result = await service.listForUser('user-1');

      expect(prisma.familyInvite.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: 'user.one@example.com',
            status: FamilyInviteStatus.PENDING,
          }),
          data: { status: FamilyInviteStatus.EXPIRED },
        }),
      );

      expect(prisma.familyInvite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            email: 'user.one@example.com',
            status: FamilyInviteStatus.PENDING,
          },
          select: expect.not.objectContaining({ tokenHash: true }),
        }),
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('acceptInvitation', () => {
    const validInvite = {
      id: 'inv-1',
      familyId: 'fam-1',
      email: 'member@example.com',
      authority: FamilyAuthority.MEMBER,
      capabilities: [],
      kinshipLabel: null,
      kinshipCustom: null,
      status: FamilyInviteStatus.PENDING,
      expiresAt: new Date(Date.now() + 86400000),
      family: { id: 'fam-1', name: 'Fam', slug: 'fam' },
    };

    it('creates one membership, marks invitation accepted, and writes audit event', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'member@example.com',
      });
      prisma.familyInvite.findUnique.mockResolvedValue(validInvite);
      prisma.familyMember.findUnique.mockResolvedValue(null);
      prisma.familyInvite.update.mockResolvedValue({
        ...validInvite,
        status: FamilyInviteStatus.ACCEPTED,
      });

      const result = await service.acceptInvitation('user-1', 'inv-1');

      expect(result.status).toBe(FamilyInviteStatus.ACCEPTED);
      expect(prisma.familyMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          familyId: 'fam-1',
          userId: 'user-1',
          authority: FamilyAuthority.MEMBER,
        }),
      });
      expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          familyId: 'fam-1',
          actorId: 'user-1',
          action: FamilyAuditAction.INVITATION_ACCEPTED,
        }),
      });
    });

    it('makes accept retry idempotent without creating duplicate membership', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'member@example.com',
      });
      prisma.familyInvite.findUnique.mockResolvedValue({
        ...validInvite,
        status: FamilyInviteStatus.ACCEPTED,
      });

      const result = await service.acceptInvitation('user-1', 'inv-1');

      expect(result.status).toBe(FamilyInviteStatus.ACCEPTED);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.familyMember.create).not.toHaveBeenCalled();
    });

    it('prevents another user from accepting an invitation', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-attacker',
        email: 'attacker@example.com',
      });
      prisma.familyInvite.findUnique.mockResolvedValue(validInvite);

      await expect(
        service.acceptInvitation('user-attacker', 'inv-1'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.familyMember.create).not.toHaveBeenCalled();
    });

    it('rejects expired invitations', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'member@example.com',
      });
      prisma.familyInvite.findUnique.mockResolvedValue({
        ...validInvite,
        expiresAt: new Date(Date.now() - 10000),
      });

      await expect(service.acceptInvitation('user-1', 'inv-1')).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.familyMember.create).not.toHaveBeenCalled();
    });
  });

  describe('declineInvitation', () => {
    const validInvite = {
      id: 'inv-1',
      familyId: 'fam-1',
      email: 'member@example.com',
      status: FamilyInviteStatus.PENDING,
      expiresAt: new Date(Date.now() + 86400000),
      family: { id: 'fam-1', name: 'Fam', slug: 'fam' },
    };

    it('updates status to DECLINED and creates an audit event', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'member@example.com',
      });
      prisma.familyInvite.findUnique.mockResolvedValue(validInvite);
      prisma.familyInvite.update.mockResolvedValue({
        ...validInvite,
        status: FamilyInviteStatus.DECLINED,
      });

      const result = await service.declineInvitation('user-1', 'inv-1');

      expect(result.status).toBe(FamilyInviteStatus.DECLINED);
      expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          familyId: 'fam-1',
          actorId: 'user-1',
          action: FamilyAuditAction.INVITATION_DECLINED,
        }),
      });
    });

    it('prevents another user from declining an invitation', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-attacker',
        email: 'attacker@example.com',
      });
      prisma.familyInvite.findUnique.mockResolvedValue(validInvite);

      await expect(
        service.declineInvitation('user-attacker', 'inv-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('is safe on retry if already declined', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'member@example.com',
      });
      prisma.familyInvite.findUnique.mockResolvedValue({
        ...validInvite,
        status: FamilyInviteStatus.DECLINED,
      });

      const result = await service.declineInvitation('user-1', 'inv-1');
      expect(result.status).toBe(FamilyInviteStatus.DECLINED);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
