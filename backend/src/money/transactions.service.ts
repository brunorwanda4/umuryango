import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FamilyCapability,
  FamilyAuthority,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, familyId: string, dto: CreateTransactionDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.familyTransaction.findUnique({
        where: {
          familyId_idempotencyKey: { familyId, idempotencyKey: dto.idempotencyKey },
        },
      });
      if (existing) {
        return {
          ...existing,
          amountMinorUnits: existing.amountMinorUnits.toString(),
        };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.familyTransaction.create({
        data: {
          familyId,
          createdById: userId,
          categoryId: dto.categoryId,
          amountMinorUnits: BigInt(dto.amountMinorUnits),
          currency: dto.currency,
          type: dto.type,
          date: new Date(dto.date),
          description: dto.description,
          paymentMethod: dto.paymentMethod,
          idempotencyKey: dto.idempotencyKey,
          status: TransactionStatus.PENDING, // Always pending initially, requiring approval
          notes: dto.notes,
          receivedFrom: dto.receivedFrom,
          receivedBy: dto.receivedBy,
        },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: 'TRANSACTION_CREATED',
          after: {
            id: created.id,
            categoryId: created.categoryId,
            amountMinorUnits: created.amountMinorUnits.toString(),
            type: created.type,
            status: created.status,
            date: created.date.toISOString(),
            description: created.description,
            paymentMethod: created.paymentMethod,
            notes: created.notes,
            receivedFrom: created.receivedFrom,
            receivedBy: created.receivedBy,
          },
        },
      });

      return {
        ...created,
        amountMinorUnits: created.amountMinorUnits.toString(),
      };
    });
  }

  async findAll(familyId: string, query?: { type?: TransactionType; status?: TransactionStatus }) {
    const where: any = { familyId };
    if (query?.type) where.type = query.type;
    if (query?.status) where.status = query.status;

    const transactions = await this.prisma.familyTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        category: { select: { name: true } },
        createdBy: { select: { fullName: true } },
      },
    });

    return transactions.map((t) => ({
      ...t,
      amountMinorUnits: t.amountMinorUnits.toString(),
    }));
  }

  async findOne(familyId: string, id: string) {
    const transaction = await this.prisma.familyTransaction.findFirst({
      where: { familyId, id },
      include: {
        category: { select: { name: true } },
        createdBy: { select: { fullName: true } },
        approvedBy: { select: { fullName: true } },
      },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');

    return {
      ...transaction,
      amountMinorUnits: transaction.amountMinorUnits.toString(),
    };
  }

  async update(userId: string, familyId: string, id: string, dto: UpdateTransactionDto) {
    const membership = await this.prisma.familyMember.findFirst({
      where: { familyId, userId, removedAt: null },
    });

    if (!membership) {
      throw new ForbiddenException('Not a family member');
    }

    const transaction = await this.prisma.familyTransaction.findFirst({
      where: { familyId, id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Rule: "If income is approved, normal users should not edit it. Admin can edit approved income if allowed."
    if (transaction.status === TransactionStatus.APPROVED) {
      const isAdmin =
        membership.authority === FamilyAuthority.HEAD ||
        membership.authority === FamilyAuthority.ADMIN;
      if (!isAdmin) {
        throw new ForbiddenException('Only family heads or admins can edit approved transactions');
      }
    }

    const data: any = { ...dto };
    if (dto.amountMinorUnits !== undefined) {
      data.amountMinorUnits = BigInt(dto.amountMinorUnits);
    }
    if (dto.date !== undefined) {
      data.date = new Date(dto.date);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.familyTransaction.update({
        where: { id },
        data,
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: 'TRANSACTION_UPDATED',
          before: {
            id: transaction.id,
            categoryId: transaction.categoryId,
            amountMinorUnits: transaction.amountMinorUnits.toString(),
            type: transaction.type,
            status: transaction.status,
            date: transaction.date.toISOString(),
            description: transaction.description,
            paymentMethod: transaction.paymentMethod,
            notes: transaction.notes,
            receivedFrom: transaction.receivedFrom,
            receivedBy: transaction.receivedBy,
          },
          after: {
            id: updated.id,
            categoryId: updated.categoryId,
            amountMinorUnits: updated.amountMinorUnits.toString(),
            type: updated.type,
            status: updated.status,
            date: updated.date.toISOString(),
            description: updated.description,
            paymentMethod: updated.paymentMethod,
            notes: updated.notes,
            receivedFrom: updated.receivedFrom,
            receivedBy: updated.receivedBy,
          },
        },
      });

      return {
        ...updated,
        amountMinorUnits: updated.amountMinorUnits.toString(),
      };
    });
  }

  async approve(userId: string, familyId: string, id: string) {
    await this.checkApprovalCapability(userId, familyId);

    const transaction = await this.prisma.familyTransaction.findFirst({
      where: { familyId, id },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not pending approval');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.familyTransaction.update({
        where: { id },
        data: {
          status: TransactionStatus.APPROVED,
          approvedById: userId,
          approvedAt: new Date(),
        },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: 'TRANSACTION_APPROVED',
          after: {
            id: updated.id,
            status: updated.status,
            approvedById: updated.approvedById,
            approvedAt: updated.approvedAt?.toISOString(),
          },
        },
      });

      return { ...updated, amountMinorUnits: updated.amountMinorUnits.toString() };
    });
  }

  async reject(userId: string, familyId: string, id: string) {
    await this.checkApprovalCapability(userId, familyId);

    const transaction = await this.prisma.familyTransaction.findFirst({
      where: { familyId, id },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not pending approval');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.familyTransaction.update({
        where: { id },
        data: {
          status: TransactionStatus.REJECTED,
        },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: 'TRANSACTION_REJECTED',
          after: {
            id: updated.id,
            status: updated.status,
          },
        },
      });

      return { ...updated, amountMinorUnits: updated.amountMinorUnits.toString() };
    });
  }

  async remove(userId: string, familyId: string, id: string) {
    const transaction = await this.prisma.familyTransaction.findFirst({
      where: { familyId, id },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.familyTransaction.update({
        where: { id },
        data: {
          status: TransactionStatus.REVERSED,
          reversedAt: new Date(),
        },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: 'TRANSACTION_REVERSED',
          after: {
            id: updated.id,
            status: updated.status,
            reversedAt: updated.reversedAt?.toISOString(),
          },
        },
      });

      return { ...updated, amountMinorUnits: updated.amountMinorUnits.toString() };
    });
  }

  private async checkApprovalCapability(userId: string, familyId: string) {
    const membership = await this.prisma.familyMember.findFirst({
      where: { familyId, userId, removedAt: null },
    });

    if (!membership) {
      throw new ForbiddenException('Not a family member');
    }

    if (!membership.capabilities.includes(FamilyCapability.APPROVE_EXPENSE)) {
      throw new ForbiddenException('You do not have permission to approve transactions');
    }
  }
}
