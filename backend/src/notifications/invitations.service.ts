import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FamilyAuditAction,
  FamilyInviteStatus,
  NotificationType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListInvitationsDto } from './dto/list-invitations.dto';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, query?: ListInvitationsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const userEmail = user.email.toLowerCase();
    const now = new Date();

    // Consistently mark any expired pending invites as EXPIRED
    await this.prisma.familyInvite.updateMany({
      where: {
        email: userEmail,
        status: FamilyInviteStatus.PENDING,
        expiresAt: { lt: now },
      },
      data: {
        status: FamilyInviteStatus.EXPIRED,
      },
    });

    const targetStatus = query?.status ?? FamilyInviteStatus.PENDING;

    const invitations = await this.prisma.familyInvite.findMany({
      where: {
        email: userEmail,
        status: targetStatus,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        familyId: true,
        invitedById: true,
        email: true,
        authority: true,
        kinshipLabel: true,
        kinshipCustom: true,
        capabilities: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        family: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            defaultCurrency: true,
            type: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return invitations;
  }

  async acceptInvitation(userId: string, inviteId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const userEmail = user.email.toLowerCase();

    const invite = await this.prisma.familyInvite.findUnique({
      where: { id: inviteId },
      include: {
        family: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invitation not found.');
    }

    if (invite.email.toLowerCase() !== userEmail) {
      throw new ForbiddenException(
        'You cannot accept an invitation addressed to another email.',
      );
    }

    // Idempotent retry: already ACCEPTED
    if (invite.status === FamilyInviteStatus.ACCEPTED) {
      return {
        id: invite.id,
        familyId: invite.familyId,
        status: invite.status,
        family: invite.family,
      };
    }

    // Check expiration
    if (
      invite.status === FamilyInviteStatus.EXPIRED ||
      invite.expiresAt < new Date()
    ) {
      if (invite.status === FamilyInviteStatus.PENDING) {
        await this.prisma.familyInvite.update({
          where: { id: inviteId },
          data: { status: FamilyInviteStatus.EXPIRED },
        });
      }
      throw new BadRequestException('Invitation has expired.');
    }

    if (invite.status !== FamilyInviteStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is not pending (status: ${invite.status}).`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existingMember = await tx.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId: invite.familyId,
            userId,
          },
        },
      });

      if (existingMember) {
        if (existingMember.removedAt) {
          await tx.familyMember.update({
            where: { id: existingMember.id },
            data: {
              removedAt: null,
              authority: invite.authority,
              capabilities: invite.capabilities,
              kinshipLabel: invite.kinshipLabel,
              kinshipCustom: invite.kinshipCustom,
            },
          });
        }
      } else {
        await tx.familyMember.create({
          data: {
            familyId: invite.familyId,
            userId,
            authority: invite.authority,
            capabilities: invite.capabilities,
            kinshipLabel: invite.kinshipLabel,
            kinshipCustom: invite.kinshipCustom,
          },
        });
      }

      const updatedInvite = await tx.familyInvite.update({
        where: { id: inviteId },
        data: { status: FamilyInviteStatus.ACCEPTED },
        include: {
          family: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId: invite.familyId,
          actorId: userId,
          action: FamilyAuditAction.INVITATION_ACCEPTED,
          after: {
            inviteId,
            email: userEmail,
            authority: invite.authority,
            capabilities: invite.capabilities,
          },
        },
      });

      // Mark any corresponding invite notification as read
      await tx.notification.updateMany({
        where: {
          userId,
          familyId: invite.familyId,
          type: NotificationType.FAMILY_INVITE,
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      return {
        id: updatedInvite.id,
        familyId: updatedInvite.familyId,
        status: updatedInvite.status,
        family: updatedInvite.family,
      };
    });
  }

  async declineInvitation(userId: string, inviteId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const userEmail = user.email.toLowerCase();

    const invite = await this.prisma.familyInvite.findUnique({
      where: { id: inviteId },
      include: {
        family: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invitation not found.');
    }

    if (invite.email.toLowerCase() !== userEmail) {
      throw new ForbiddenException(
        'You cannot decline an invitation addressed to another email.',
      );
    }

    // Idempotent retry: already DECLINED
    if (invite.status === FamilyInviteStatus.DECLINED) {
      return {
        id: invite.id,
        familyId: invite.familyId,
        status: invite.status,
        family: invite.family,
      };
    }

    if (
      invite.status === FamilyInviteStatus.EXPIRED ||
      invite.expiresAt < new Date()
    ) {
      if (invite.status === FamilyInviteStatus.PENDING) {
        await this.prisma.familyInvite.update({
          where: { id: inviteId },
          data: { status: FamilyInviteStatus.EXPIRED },
        });
      }
      throw new BadRequestException('Invitation has expired.');
    }

    if (invite.status !== FamilyInviteStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is not pending (status: ${invite.status}).`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedInvite = await tx.familyInvite.update({
        where: { id: inviteId },
        data: { status: FamilyInviteStatus.DECLINED },
        include: {
          family: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId: invite.familyId,
          actorId: userId,
          action: FamilyAuditAction.INVITATION_DECLINED,
          after: {
            inviteId,
            email: userEmail,
          },
        },
      });

      // Mark any corresponding invite notification as read
      await tx.notification.updateMany({
        where: {
          userId,
          familyId: invite.familyId,
          type: NotificationType.FAMILY_INVITE,
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      return {
        id: updatedInvite.id,
        familyId: updatedInvite.familyId,
        status: updatedInvite.status,
        family: updatedInvite.family,
      };
    });
  }
}
