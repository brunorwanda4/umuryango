import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FamilyCapability, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, familyId: string, dto: CreateTransactionDto) {
    // Basic check for family and idempotency
    if (dto.idempotencyKey) {
      const existing = await this.prisma.familyTransaction.findUnique({
        where: {
          familyId_idempotencyKey: { familyId, idempotencyKey: dto.idempotencyKey },
        },
      });
      if (existing) {
        return existing;
      }
    }

    return this.prisma.familyTransaction.create({
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
      },
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

    // Convert BigInt to string for JSON serialization
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

  async update(familyId: string, id: string, dto: UpdateTransactionDto) {
    await this.findOne(familyId, id); // Ensure it exists
    
    // We only allow updating pending transactions or specific fields.
    // For simplicity, we just update the allowed fields.
    const data: any = { ...dto };
    if (dto.amountMinorUnits !== undefined) {
      data.amountMinorUnits = BigInt(dto.amountMinorUnits);
    }
    if (dto.date !== undefined) {
      data.date = new Date(dto.date);
    }

    const updated = await this.prisma.familyTransaction.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      amountMinorUnits: updated.amountMinorUnits.toString(),
    };
  }

  async approve(userId: string, familyId: string, id: string) {
    await this.checkApprovalCapability(userId, familyId);

    const transaction = await this.findOne(familyId, id);
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not pending approval');
    }

    const updated = await this.prisma.familyTransaction.update({
      where: { id },
      data: {
        status: TransactionStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    return { ...updated, amountMinorUnits: updated.amountMinorUnits.toString() };
  }

  async reject(userId: string, familyId: string, id: string) {
    await this.checkApprovalCapability(userId, familyId);

    const transaction = await this.findOne(familyId, id);
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not pending approval');
    }

    const updated = await this.prisma.familyTransaction.update({
      where: { id },
      data: {
        status: TransactionStatus.REJECTED,
      },
    });

    return { ...updated, amountMinorUnits: updated.amountMinorUnits.toString() };
  }

  async remove(familyId: string, id: string) {
    // Soft delete or reverse based on rules
    // Rule: "Do not hard-delete financial... Prefer soft deletion or reversal records."
    await this.findOne(familyId, id);

    const updated = await this.prisma.familyTransaction.update({
      where: { id },
      data: {
        status: TransactionStatus.REVERSED,
        reversedAt: new Date(),
      },
    });

    return { ...updated, amountMinorUnits: updated.amountMinorUnits.toString() };
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
