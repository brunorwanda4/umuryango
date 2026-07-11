import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  TransactionType,
} from '@prisma/client';
import { can } from '../families/family-access';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    familyId: string,
    createCategoryDto: CreateCategoryDto,
    createdById: string,
  ) {
    const membership = await this.requireMembership(createdById, familyId);
    this.requireRecordCapability(membership, createCategoryDto.type);
    await this.requireUniqueName(
      familyId,
      createCategoryDto.type,
      createCategoryDto.name,
    );

    return this.prisma.$transaction(async (tx) => {
      const category = await tx.familyTransactionCategory.create({
        data: {
          familyId,
          name: createCategoryDto.name.trim(),
          type: createCategoryDto.type,
          description: createCategoryDto.description,
          icon: createCategoryDto.icon,
          color: createCategoryDto.color,
          status: createCategoryDto.status ?? 'ACTIVE',
          createdById,
        },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: createdById,
          action: FamilyAuditAction.CATEGORY_CREATED,
          after: this.auditSnapshot(category),
        },
      });
      return category;
    });
  }

  async findAll(userId: string, familyId: string) {
    await this.requireMembership(userId, familyId);
    const categories = await this.prisma.familyTransactionCategory.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { fullName: true } },
      },
    });

    return categories.map(({ createdBy, ...rest }) => ({
      ...rest,
      createdByName: createdBy?.fullName ?? null,
    }));
  }

  async findOne(userId: string, familyId: string, id: string) {
    await this.requireMembership(userId, familyId);
    return this.findCategory(familyId, id);
  }

  private async findCategory(familyId: string, id: string) {
    const category = await this.prisma.familyTransactionCategory.findFirst({
      where: { familyId, id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    userId: string,
    familyId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    await this.requireCategoryManager(userId, familyId);
    const existing = await this.findCategory(familyId, id);
    await this.requireUniqueName(
      familyId,
      updateCategoryDto.type ?? existing.type,
      updateCategoryDto.name ?? existing.name,
      id,
    );

    return this.prisma.$transaction(async (tx) => {
      const category = await tx.familyTransactionCategory.update({
        where: { id },
        data: updateCategoryDto,
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.CATEGORY_UPDATED,
          before: this.auditSnapshot(existing),
          after: this.auditSnapshot(category),
        },
      });
      return category;
    });
  }

  async remove(userId: string, familyId: string, id: string) {
    await this.requireCategoryManager(userId, familyId);
    const existing = await this.findCategory(familyId, id);

    return this.prisma.$transaction(async (tx) => {
      const category = await tx.familyTransactionCategory.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.CATEGORY_ARCHIVED,
          before: this.auditSnapshot(existing),
          after: this.auditSnapshot(category),
        },
      });
      return category;
    });
  }

  private async requireMembership(userId: string, familyId: string) {
    const membership = await this.prisma.familyMember.findFirst({
      where: { familyId, userId, removedAt: null },
    });
    if (!membership) throw new ForbiddenException('Not a family member');
    return membership;
  }

  private requireRecordCapability(
    membership: {
      authority: FamilyAuthority;
      capabilities: FamilyCapability[];
    },
    type: TransactionType,
  ) {
    const capability =
      type === TransactionType.INCOME
        ? FamilyCapability.RECORD_INCOME
        : FamilyCapability.RECORD_EXPENSE;
    if (!can(membership, capability)) {
      throw new ForbiddenException('You cannot create this category type');
    }
  }

  private async requireCategoryManager(userId: string, familyId: string) {
    const membership = await this.requireMembership(userId, familyId);
    if (
      membership.authority !== FamilyAuthority.HEAD &&
      membership.authority !== FamilyAuthority.ADMIN
    ) {
      throw new ForbiddenException(
        'Only family managers can change categories',
      );
    }
  }

  private async requireUniqueName(
    familyId: string,
    type: TransactionType,
    name: string,
    excludeId?: string,
  ) {
    const duplicate = await this.prisma.familyTransactionCategory.findFirst({
      where: {
        familyId,
        type,
        name: { equals: name.trim(), mode: 'insensitive' },
        id: excludeId ? { not: excludeId } : undefined,
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException(
        `A ${type.toLowerCase()} category with this name already exists`,
      );
    }
  }

  private auditSnapshot(category: {
    id: string;
    name: string;
    type: TransactionType;
    status: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  }) {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      status: category.status,
      description: category.description,
      icon: category.icon,
      color: category.color,
    };
  }
}
