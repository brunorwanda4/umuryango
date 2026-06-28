import { randomBytes } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FamilyInviteStatus, FamilyMemberRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateFamilyDto } from './dto/create-family.dto';

export type CreatedFamily = {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: string;
  contributionCadence: string;
  description: string | null;
  invitedEmails: string[];
  createdAt: Date;
};

export type UserFamily = {
  id: string;
  name: string;
  slug: string;
  role: FamilyMemberRole;
};

export type FamilyMemberSummary = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: FamilyMemberRole;
  joinedAt: Date;
};

export type FamilyDetail = {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: string;
  contributionCadence: string;
  description: string | null;
  createdAt: Date;
  role: FamilyMemberRole;
  memberCount: number;
  members: FamilyMemberSummary[];
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

  async create(
    userId: string,
    dto: CreateFamilyDto,
  ): Promise<CreatedFamily> {
    const creator = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!creator) {
      throw new UnauthorizedException('User no longer exists.');
    }

    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.name);

    // Do not invite the creator to their own family.
    const inviteEmails = (dto.inviteEmails ?? []).filter(
      (email) => email !== creator.email.toLowerCase(),
    );
    const uniqueInviteEmails = [...new Set(inviteEmails)];

    const invites = await Promise.all(
      uniqueInviteEmails.map(async (email) => {
        const token = randomBytes(32).toString('base64url');
        return {
          email,
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
        description: dto.description || null,
        createdById: creator.id,
        members: {
          create: {
            userId: creator.id,
            role: FamilyMemberRole.OWNER,
          },
        },
        invites: {
          create: invites.map((invite) => ({
            email: invite.email,
            tokenHash: invite.tokenHash,
            status: FamilyInviteStatus.PENDING,
            expiresAt,
          })),
        },
      },
    });

    // Best-effort: a failed invite email must not roll back family creation.
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
      description: family.description,
      invitedEmails: uniqueInviteEmails,
      createdAt: family.createdAt,
    };
  }

  async listForUser(userId: string, limit?: number): Promise<UserFamily[]> {
    const memberships = await this.prisma.familyMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { family: true },
    });

    return memberships.map((membership) => ({
      id: membership.family.id,
      name: membership.family.name,
      slug: membership.family.slug,
      role: membership.role,
    }));
  }

  async getBySlugForUser(userId: string, slug: string): Promise<FamilyDetail> {
    const family = await this.prisma.family.findUnique({
      where: { slug },
      include: {
        members: {
          orderBy: { createdAt: 'asc' },
          include: { user: true },
        },
      },
    });

    // Return the same 404 for a missing family and for a non-member so we
    // never leak whether a given family slug exists (IDOR guard).
    if (!family) {
      throw new NotFoundException('Family not found.');
    }

    const membership = family.members.find(
      (member) => member.userId === userId,
    );

    if (!membership) {
      throw new NotFoundException('Family not found.');
    }

    return {
      id: family.id,
      name: family.name,
      slug: family.slug,
      country: family.country,
      defaultCurrency: family.defaultCurrency,
      contributionCadence: family.contributionCadence,
      description: family.description,
      createdAt: family.createdAt,
      role: membership.role,
      memberCount: family.members.length,
      members: family.members.map((member) => ({
        id: member.id,
        userId: member.userId,
        fullName: member.user.fullName,
        avatarUrl: member.user.avatarUrl,
        role: member.role,
        joinedAt: member.createdAt,
      })),
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

    // Append a short random suffix until we find a free slug.
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
