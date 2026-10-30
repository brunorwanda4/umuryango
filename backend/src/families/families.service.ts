import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  FamilyInviteStatus,
  FamilyKinship,
  FamilyType,
} from '@prisma/client';
import { hash } from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { DEFAULT_MONEY_CATEGORIES } from '../money/default-categories';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateFamilyDto,
  CreateFamilyInviteDto,
} from './dto/create-family.dto';
import type { InviteMemberDto } from './dto/invite-member.dto';
import type { UpdateFamilySettingsDto } from './dto/update-family-settings.dto';
import type { UpdateMemberDto } from './dto/update-member.dto';
import {
  assertGrantableSubset,
  can,
  canManageTarget,
  DEFAULT_CAPABILITIES,
} from './family-access';

export type CreatedFamily = {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: string;
  contributionCadence: string;
  type: FamilyType;
  description: string | null;
  invitedEmails: string[];
  createdAt: Date;
};

export type UserFamily = {
  id: string;
  name: string;
  slug: string;
  authority: FamilyAuthority;
};

export type FamilyMemberSummary = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  authority: FamilyAuthority;
  kinshipLabel: FamilyKinship | null;
  kinshipCustom: string | null;
  capabilities: FamilyCapability[];
  joinedAt: Date;
};

export type FamilyDetail = {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: string;
  contributionCadence: string;
  type: FamilyType;
  description: string | null;
  createdAt: Date;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  memberCount: number;
  members: FamilyMemberSummary[];
};

export type FamilyAuditSummary = {
  id: string;
  action: FamilyAuditAction;
  actorId: string;
  targetMemberId: string | null;
  createdAt: Date;
};

type ActiveFamilyMember = {
  id: string;
  familyId: string;
  userId: string;
  authority: FamilyAuthority;
  kinshipLabel: FamilyKinship | null;
  kinshipCustom: string | null;
  capabilities: FamilyCapability[];
  removedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    fullName: string;
    email?: string;
    avatarUrl: string | null;
  };
};

type FamilyWithActiveMembers = {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: string;
  contributionCadence: string;
  type: FamilyType;
  description: string | null;
  createdAt: Date;
  members: ActiveFamilyMember[];
};

@Injectable()
export class FamiliesService {
  private readonly logger = new Logger(FamiliesService.name);
  private readonly inviteExpiresInDays = 14;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: string, dto: CreateFamilyDto): Promise<CreatedFamily> {
    const creator = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!creator) {
      throw new UnauthorizedException('User no longer exists.');
    }

    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.name);

    const creatorEmail = creator.email.toLowerCase();
    const uniqueInvitesByEmail = new Map<string, CreateFamilyInviteDto>();
    for (const invite of dto.invites ?? []) {
      const email = invite.email.toLowerCase();
      if (email === creatorEmail || uniqueInvitesByEmail.has(email)) {
        continue;
      }
      uniqueInvitesByEmail.set(email, invite);
    }
    const uniqueInviteEmails = [...uniqueInvitesByEmail.keys()];

    const invites = await Promise.all(
      [...uniqueInvitesByEmail.values()].map(async (invite) => {
        const token = randomBytes(32).toString('base64url');
        return {
          email: invite.email.toLowerCase(),
          kinshipLabel: invite.kinshipLabel ?? null,
          token,
          tokenHash: await hash(token, 10),
        };
      }),
    );

    const expiresAt = new Date(
      Date.now() + this.inviteExpiresInDays * 24 * 60 * 60 * 1000,
    );

    const family = await this.prisma.family.create({
      data: {
        name: dto.name,
        slug,
        country: dto.country,
        defaultCurrency: dto.defaultCurrency,
        contributionCadence: dto.contributionCadence,
        type: dto.type ?? FamilyType.NUCLEAR,
        description: dto.description || null,
        createdById: creator.id,
        members: {
          create: {
            userId: creator.id,
            authority: FamilyAuthority.HEAD,
            capabilities: DEFAULT_CAPABILITIES[FamilyAuthority.HEAD],
          },
        },
        invites: {
          create: invites.map((invite) => ({
            email: invite.email,
            authority: FamilyAuthority.MEMBER,
            kinshipLabel: invite.kinshipLabel,
            capabilities: DEFAULT_CAPABILITIES[FamilyAuthority.MEMBER],
            tokenHash: invite.tokenHash,
            status: FamilyInviteStatus.PENDING,
            expiresAt,
          })),
        },
        transactionCategories: {
          create: DEFAULT_MONEY_CATEGORIES,
        },
      },
    });

    await Promise.all(
      invites.map((invite) =>
        this.sendInviteEmail({
          email: invite.email,
          token: invite.token,
          familyName: family.name,
          inviterName: creator.fullName,
        }),
      ),
    );

    return {
      id: family.id,
      name: family.name,
      slug: family.slug,
      country: family.country,
      defaultCurrency: family.defaultCurrency,
      contributionCadence: family.contributionCadence,
      type: family.type,
      description: family.description,
      invitedEmails: uniqueInviteEmails,
      createdAt: family.createdAt,
    };
  }

  async listForUser(userId: string, limit?: number): Promise<UserFamily[]> {
    const memberships = await this.prisma.familyMember.findMany({
      where: {
        userId,
        removedAt: null,
        family: { personalOwnerId: null },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { family: true },
    });

    return memberships.map((membership) => ({
      id: membership.family.id,
      name: membership.family.name,
      slug: membership.family.slug,
      authority: membership.authority,
    }));
  }

  async getOrCreatePersonalWorkspace(userId: string): Promise<FamilyDetail> {
    const existingWorkspace = await this.prisma.family.findUnique({
      where: { personalOwnerId: userId },
      select: { slug: true },
    });

    if (existingWorkspace) {
      return this.getBySlugForUser(userId, existingWorkspace.slug);
    }

    const existingFamily = (await this.listForUser(userId, 1))[0];
    if (existingFamily) {
      return this.getBySlugForUser(userId, existingFamily.slug);
    }

    const family = await this.prisma.family.upsert({
      where: { personalOwnerId: userId },
      update: {},
      create: {
        name: 'Personal workspace',
        slug: `personal-${userId}`,
        country: 'RW',
        defaultCurrency: 'RWF',
        contributionCadence: 'monthly',
        type: FamilyType.NUCLEAR,
        createdById: userId,
        personalOwnerId: userId,
        members: {
          create: {
            userId,
            authority: FamilyAuthority.HEAD,
            capabilities: DEFAULT_CAPABILITIES[FamilyAuthority.HEAD],
          },
        },
      },
    });

    return this.getBySlugForUser(userId, family.slug);
  }

  async getBySlugForUser(userId: string, slug: string): Promise<FamilyDetail> {
    const { family, membership } = await this.requireMembership(userId, slug);

    return this.toFamilyDetail(family, membership);
  }

  async inviteMember(
    userId: string,
    slug: string,
    dto: InviteMemberDto,
  ): Promise<{ email: string; authority: FamilyAuthority }> {
    const { family, membership } = await this.requireMembership(userId, slug);

    if (!can(membership, FamilyCapability.MANAGE_MEMBERS)) {
      throw new ForbiddenException('You cannot invite family members.');
    }

    if (dto.authority === FamilyAuthority.HEAD) {
      throw new BadRequestException('Use the head grant flow for head access.');
    }

    const targetAccess = {
      authority: dto.authority,
      capabilities: dto.capabilities ?? DEFAULT_CAPABILITIES[dto.authority],
    };

    if (!canManageTarget(membership, targetAccess)) {
      throw new ForbiddenException('You cannot assign that authority.');
    }

    assertGrantableSubset(membership, targetAccess.capabilities);

    const token = randomBytes(32).toString('base64url');
    const tokenHash = await hash(token, 10);
    const expiresAt = new Date(
      Date.now() + this.inviteExpiresInDays * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.familyInvite.upsert({
        where: {
          familyId_email: {
            familyId: family.id,
            email: dto.email,
          },
        },
        create: {
          familyId: family.id,
          email: dto.email,
          authority: dto.authority,
          kinshipLabel: dto.kinshipLabel,
          kinshipCustom: dto.kinshipCustom || null,
          capabilities: targetAccess.capabilities,
          tokenHash,
          status: FamilyInviteStatus.PENDING,
          expiresAt,
        },
        update: {
          authority: dto.authority,
          kinshipLabel: dto.kinshipLabel,
          kinshipCustom: dto.kinshipCustom || null,
          capabilities: targetAccess.capabilities,
          tokenHash,
          status: FamilyInviteStatus.PENDING,
          expiresAt,
        },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: FamilyAuditAction.MEMBER_INVITED,
          after: {
            email: dto.email,
            authority: dto.authority,
            capabilities: targetAccess.capabilities,
          },
        },
      });
    });

    await this.sendInviteEmail({
      email: dto.email,
      token,
      familyName: family.name,
      inviterName: membership.user.fullName,
    });

    return { email: dto.email, authority: dto.authority };
  }

  async updateMember(
    userId: string,
    slug: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<FamilyMemberSummary> {
    const { family, membership } = await this.requireMembership(userId, slug);
    const target = this.findTargetMember(family, memberId);

    if (!canManageTarget(membership, target)) {
      throw new ForbiddenException('You cannot update this member.');
    }

    const nextAuthority = dto.authority ?? target.authority;

    if (
      nextAuthority === FamilyAuthority.HEAD &&
      target.authority !== FamilyAuthority.HEAD
    ) {
      throw new BadRequestException('Use the head grant flow for head access.');
    }

    if (
      membership.authority !== FamilyAuthority.HEAD &&
      nextAuthority !== target.authority
    ) {
      throw new ForbiddenException('You cannot change this authority.');
    }

    if (
      target.authority === FamilyAuthority.HEAD &&
      nextAuthority !== FamilyAuthority.HEAD &&
      this.countHeads(family) <= 1
    ) {
      throw new BadRequestException('A family must keep at least one head.');
    }

    const capabilities =
      dto.capabilities ??
      (nextAuthority === target.authority
        ? target.capabilities
        : DEFAULT_CAPABILITIES[nextAuthority]);

    assertGrantableSubset(membership, capabilities);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.familyMember.update({
        where: { id: memberId },
        data: {
          authority: nextAuthority,
          kinshipLabel:
            dto.kinshipLabel === undefined ? undefined : dto.kinshipLabel,
          kinshipCustom:
            dto.kinshipCustom === undefined
              ? undefined
              : dto.kinshipCustom || null,
          capabilities,
        },
        include: { user: true },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action:
            target.authority !== nextAuthority
              ? FamilyAuditAction.AUTHORITY_CHANGED
              : FamilyAuditAction.CAPABILITIES_CHANGED,
          targetMemberId: memberId,
          before: {
            authority: target.authority,
            capabilities: target.capabilities,
            kinshipLabel: target.kinshipLabel,
            kinshipCustom: target.kinshipCustom,
          },
          after: {
            authority: nextAuthority,
            capabilities,
            kinshipLabel:
              dto.kinshipLabel === undefined
                ? target.kinshipLabel
                : dto.kinshipLabel,
            kinshipCustom:
              dto.kinshipCustom === undefined
                ? target.kinshipCustom
                : dto.kinshipCustom || null,
          },
        },
      });

      return row;
    });

    return this.toMemberSummary(updated);
  }

  async removeMember(
    userId: string,
    slug: string,
    memberId: string,
  ): Promise<{ id: string }> {
    const { family, membership } = await this.requireMembership(userId, slug);
    const target = this.findTargetMember(family, memberId);

    if (!canManageTarget(membership, target)) {
      throw new ForbiddenException('You cannot remove this member.');
    }

    if (
      target.authority === FamilyAuthority.HEAD &&
      this.countHeads(family) <= 1
    ) {
      throw new BadRequestException('A family must keep at least one head.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.familyMember.update({
        where: { id: memberId },
        data: { removedAt: new Date() },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: FamilyAuditAction.MEMBER_REMOVED,
          targetMemberId: memberId,
          before: { authority: target.authority },
        },
      });
    });

    return { id: memberId };
  }

  async grantHead(
    userId: string,
    slug: string,
    memberId: string,
  ): Promise<FamilyMemberSummary> {
    const { family, membership } = await this.requireMembership(userId, slug);
    const target = this.findTargetMember(family, memberId);

    if (membership.authority !== FamilyAuthority.HEAD) {
      throw new ForbiddenException('Only a family head can grant head access.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.familyMember.update({
        where: { id: memberId },
        data: {
          authority: FamilyAuthority.HEAD,
          capabilities: DEFAULT_CAPABILITIES[FamilyAuthority.HEAD],
        },
        include: { user: true },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: FamilyAuditAction.HEAD_GRANTED,
          targetMemberId: memberId,
          before: { authority: target.authority },
          after: { authority: FamilyAuthority.HEAD },
        },
      });

      return row;
    });

    return this.toMemberSummary(updated);
  }

  async updateSettings(
    userId: string,
    slug: string,
    dto: UpdateFamilySettingsDto,
  ): Promise<FamilyDetail> {
    const { family, membership } = await this.requireMembership(userId, slug);

    if (!can(membership, FamilyCapability.MANAGE_FAMILY_SETTINGS)) {
      throw new ForbiddenException('You cannot update family settings.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.family.update({
        where: { id: family.id },
        data: {
          name: dto.name,
          type: dto.type,
          defaultCurrency: dto.defaultCurrency,
          contributionCadence: dto.contributionCadence,
          description:
            dto.description === undefined ? undefined : dto.description || null,
        },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: FamilyAuditAction.SETTINGS_CHANGED,
          after: {
            name: dto.name,
            type: dto.type,
            defaultCurrency: dto.defaultCurrency,
            contributionCadence: dto.contributionCadence,
            description: dto.description,
          },
        },
      });
    });

    return this.getBySlugForUser(userId, slug);
  }

  async listAudit(
    userId: string,
    slug: string,
    limit = 50,
  ): Promise<FamilyAuditSummary[]> {
    const { family, membership } = await this.requireMembership(userId, slug);

    if (!can(membership, FamilyCapability.MANAGE_MEMBERS)) {
      throw new ForbiddenException('You cannot read this audit log.');
    }

    const events = await this.prisma.familyAuditEvent.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });

    return events.map((event) => ({
      id: event.id,
      action: event.action,
      actorId: event.actorId,
      targetMemberId: event.targetMemberId,
      createdAt: event.createdAt,
    }));
  }

  async requireMembership(
    userId: string,
    slug: string,
  ): Promise<{
    family: FamilyWithActiveMembers;
    membership: ActiveFamilyMember;
  }> {
    const family = await this.prisma.family.findUnique({
      where: { slug },
      include: {
        members: {
          where: { removedAt: null },
          orderBy: { createdAt: 'asc' },
          include: { user: true },
        },
      },
    });

    if (!family) {
      throw new NotFoundException('Family not found.');
    }

    const membership = family.members.find(
      (member) => member.userId === userId,
    );

    if (!membership) {
      throw new NotFoundException('Family not found.');
    }

    return { family, membership };
  }

  private findTargetMember(
    family: FamilyWithActiveMembers,
    memberId: string,
  ): ActiveFamilyMember {
    const target = family.members.find((member) => member.id === memberId);

    if (!target) {
      throw new NotFoundException('Family member not found.');
    }

    return target;
  }

  private countHeads(family: FamilyWithActiveMembers): number {
    return family.members.filter(
      (member) => member.authority === FamilyAuthority.HEAD,
    ).length;
  }

  private toFamilyDetail(
    family: FamilyWithActiveMembers,
    membership: ActiveFamilyMember,
  ): FamilyDetail {
    return {
      id: family.id,
      name: family.name,
      slug: family.slug,
      country: family.country,
      defaultCurrency: family.defaultCurrency,
      contributionCadence: family.contributionCadence,
      type: family.type,
      description: family.description,
      createdAt: family.createdAt,
      authority: membership.authority,
      capabilities: membership.capabilities,
      memberCount: family.members.length,
      members: family.members.map((member) => this.toMemberSummary(member)),
    };
  }

  private toMemberSummary(member: {
    id: string;
    userId: string;
    authority: FamilyAuthority;
    kinshipLabel: FamilyKinship | null;
    kinshipCustom: string | null;
    capabilities: FamilyCapability[];
    createdAt: Date;
    user: {
      fullName: string;
      avatarUrl: string | null;
    };
  }): FamilyMemberSummary {
    return {
      id: member.id,
      userId: member.userId,
      fullName: member.user.fullName,
      avatarUrl: member.user.avatarUrl,
      authority: member.authority,
      kinshipLabel: member.kinshipLabel,
      kinshipCustom: member.kinshipCustom,
      capabilities: member.capabilities,
      joinedAt: member.createdAt,
    };
  }

  private async sendInviteEmail({
    email,
    token,
    familyName,
    inviterName,
  }: {
    email: string;
    token: string;
    familyName: string;
    inviterName: string;
  }): Promise<void> {
    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:4974'
    ).replace(/\/$/, '');
    const inviteUrl = `${frontendUrl}/family/invite/${token}`;

    try {
      await this.mailService.sendFamilyInvite({
        to: email,
        familyName,
        inviterName,
        inviteUrl,
        expiresInDays: this.inviteExpiresInDays,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send family invite to ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async resolveUniqueSlug(source: string): Promise<string> {
    const base = this.slugify(source) || 'family';

    const existing = await this.prisma.family.findUnique({
      where: { slug: base },
    });
    if (!existing) {
      return base;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `${base}-${randomBytes(3).toString('hex')}`;
      const taken = await this.prisma.family.findUnique({
        where: { slug: candidate },
      });
      if (!taken) {
        return candidate;
      }
    }

    throw new ConflictException(
      'Could not generate a unique family address. Try a different name.',
    );
  }
}
