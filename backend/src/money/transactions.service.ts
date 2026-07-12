import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryStatus,
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  FamilyContactStatus,
  IncomePaymentStatus,
  IncomeRecurrence,
  Prisma,
  TransactionScope,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { can } from '../families/family-access';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RecordIncomePaymentDto } from './dto/record-income-payment.dto';
import { TransactionDashboardQueryDto } from './dto/transaction-dashboard-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, familyId: string, dto: CreateTransactionDto) {
    const membership = await this.requireMembership(userId, familyId);
    this.requireRecordCapability(membership, dto.type);
    return this.createScoped(userId, familyId, dto, TransactionScope.FAMILY);
  }

  async createPersonal(
    userId: string,
    familyId: string,
    dto: CreateTransactionDto,
  ) {
    await this.requireMembership(userId, familyId);
    return this.createScoped(userId, familyId, dto, TransactionScope.PERSONAL);
  }

  private async createScoped(
    userId: string,
    familyId: string,
    dto: CreateTransactionDto,
    scope: TransactionScope,
  ) {
    await this.requireCategory(familyId, dto.categoryId, dto.type);
    const receivedFromContact = dto.receivedFromContactId
      ? await this.requireContact(familyId, dto.receivedFromContactId)
      : null;

    if (dto.idempotencyKey) {
      const existing = await this.prisma.familyTransaction.findUnique({
        where: {
          familyId_idempotencyKey: {
            familyId,
            idempotencyKey: dto.idempotencyKey,
          },
        },
      });
      if (existing) {
        if (existing.scope !== scope || existing.createdById !== userId) {
          throw new BadRequestException(
            'Idempotency key is already used by another transaction',
          );
        }
        return this.serializeTransaction(existing);
      }
    }

    const trackingData = this.buildTrackingData(dto);

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.familyTransaction.create({
        data: {
          familyId,
          createdById: userId,
          categoryId: dto.categoryId,
          amountMinorUnits: BigInt(dto.amountMinorUnits),
          currency: dto.currency,
          type: dto.type,
          scope,
          date: new Date(dto.date),
          description: this.nullableString(dto.description),
          paymentMethod: this.nullableString(dto.paymentMethod),
          idempotencyKey: dto.idempotencyKey,
          status:
            scope === TransactionScope.PERSONAL
              ? TransactionStatus.APPROVED
              : TransactionStatus.PENDING,
          notes: this.nullableString(dto.notes),
          receivedFrom:
            this.nullableString(dto.receivedFrom) ??
            receivedFromContact?.fullName,
          receivedBy: this.nullableString(dto.receivedBy),
          receivedFromContactId: receivedFromContact?.id,
          ...trackingData,
        },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.TRANSACTION_CREATED,
          after: this.auditSnapshot(created),
        },
      });

      return this.serializeTransaction(created);
    });
  }

  async recordIncomePayment(
    userId: string,
    familyId: string,
    sourceTransactionId: string,
    dto: RecordIncomePaymentDto,
  ) {
    const membership = await this.requireMembership(userId, familyId);
    this.requireRecordCapability(membership, TransactionType.INCOME);

    const source = await this.prisma.familyTransaction.findFirst({
      where: {
        id: sourceTransactionId,
        familyId,
        scope: TransactionScope.FAMILY,
        type: TransactionType.INCOME,
      },
    });

    if (!source) {
      throw new NotFoundException('Income transaction not found');
    }

    if (source.incomeRecurrence !== IncomeRecurrence.MONTHLY) {
      throw new BadRequestException(
        'Payments can only be recorded against monthly income',
      );
    }

    if (source.status === TransactionStatus.REVERSED) {
      throw new BadRequestException(
        'Payments cannot be recorded against a reversed income transaction',
      );
    }

    const expectedAmountMinorUnits = source.expectedAmountMinorUnits;
    const dueDate = source.dueDate;

    if (!expectedAmountMinorUnits || !dueDate) {
      throw new BadRequestException(
        'Monthly income source is missing expected amount or due date',
      );
    }

    if (dto.idempotencyKey) {
      const existing = await this.prisma.familyTransaction.findUnique({
        where: {
          familyId_idempotencyKey: {
            familyId,
            idempotencyKey: dto.idempotencyKey,
          },
        },
      });
      if (existing) {
        return this.serializeTransaction(existing);
      }
    }

    const amountMinorUnits = BigInt(dto.amountMinorUnits);
    const receivedFromContact = dto.receivedFromContactId
      ? await this.requireContact(familyId, dto.receivedFromContactId)
      : null;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.familyTransaction.create({
        data: {
          familyId,
          createdById: userId,
          categoryId: source.categoryId,
          amountMinorUnits,
          currency: source.currency,
          type: TransactionType.INCOME,
          date: new Date(dto.date),
          description: source.description,
          paymentMethod:
            this.nullableString(dto.paymentMethod) ?? source.paymentMethod,
          idempotencyKey: dto.idempotencyKey,
          status: TransactionStatus.PENDING,
          notes: this.nullableString(dto.notes),
          receivedFrom: receivedFromContact?.fullName ?? source.receivedFrom,
          receivedBy: this.nullableString(dto.receivedBy) ?? source.receivedBy,
          receivedFromContactId:
            receivedFromContact?.id ?? source.receivedFromContactId,
          incomeRecurrence: IncomeRecurrence.MONTHLY,
          expectedAmountMinorUnits,
          dueDate,
          periodStart: source.periodStart,
          periodEnd: source.periodEnd,
          propertyName: source.propertyName,
          paymentStatus: this.resolvePaymentStatus(
            amountMinorUnits,
            expectedAmountMinorUnits,
          ),
        },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.TRANSACTION_CREATED,
          after: {
            ...this.auditSnapshot(created),
            sourceTransactionId: source.id,
          },
        },
      });

      return this.serializeTransaction(created);
    });
  }

  async findAll(
    userId: string,
    familyId: string,
    query?: { type?: TransactionType; status?: TransactionStatus },
  ) {
    await this.requireMembership(userId, familyId);

    const where: Prisma.FamilyTransactionWhereInput = {
      familyId,
      scope: TransactionScope.FAMILY,
    };
    if (query?.type) where.type = query.type;
    if (query?.status) where.status = query.status;

    const transactions = await this.prisma.familyTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        category: { select: { name: true } },
        createdBy: { select: { fullName: true } },
        receivedFromContact: {
          select: { id: true, fullName: true, phoneNumber: true },
        },
        receipts: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSizeBytes: true,
            createdAt: true,
          },
        },
      },
    });

    return transactions.map((t) => this.serializeTransaction(t));
  }

  async dashboard(
    userId: string,
    familyId: string,
    query: TransactionDashboardQueryDto,
  ) {
    await this.requireMembership(userId, familyId);
    const period = this.resolveDashboardPeriod(query.from, query.to);
    const ownershipWhere: Prisma.FamilyTransactionWhereInput = {
      familyId,
      createdById: userId,
      scope: TransactionScope.PERSONAL,
      type: query.type,
    };
    const activeWhere: Prisma.FamilyTransactionWhereInput = {
      ...ownershipWhere,
      status: {
        in: [TransactionStatus.PENDING, TransactionStatus.APPROVED],
      },
    };
    const periodWhere: Prisma.FamilyTransactionWhereInput = {
      ...ownershipWhere,
      status: { not: TransactionStatus.REVERSED },
      date: { gte: period.from, lt: period.toExclusive },
    };

    const [allTime, largest, records] = await Promise.all([
      this.prisma.familyTransaction.aggregate({
        where: activeWhere,
        _count: { _all: true },
        _sum: { amountMinorUnits: true },
      }),
      this.prisma.familyTransaction.findFirst({
        where: {
          ...activeWhere,
          date: { gte: period.from, lt: period.toExclusive },
        },
        orderBy: [{ amountMinorUnits: 'desc' }, { date: 'desc' }],
        include: { category: { select: { name: true } } },
      }),
      this.prisma.familyTransaction.findMany({
        where: periodWhere,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { name: true, icon: true, color: true } },
          createdBy: { select: { fullName: true } },
        },
      }),
    ]);

    const activeRecords = records.filter(
      (record) =>
        record.status === TransactionStatus.PENDING ||
        record.status === TransactionStatus.APPROVED,
    );
    const periodTotal = activeRecords.reduce(
      (total, record) => total + record.amountMinorUnits,
      0n,
    );

    return {
      period: {
        from: this.dateKey(period.from),
        to: this.dateKey(new Date(period.toExclusive.getTime() - 1)),
      },
      summary: {
        allTimeTotalMinorUnits: (
          allTime._sum.amountMinorUnits ?? 0n
        ).toString(),
        transactionCount: allTime._count._all,
        periodTotalMinorUnits: periodTotal.toString(),
        ...(query.type === TransactionType.EXPENSE
          ? {
              largestExpense: largest
                ? {
                    amountMinorUnits: largest.amountMinorUnits.toString(),
                    category: largest.category.name,
                    description: largest.description,
                  }
                : null,
            }
          : {
              largestIncome: largest
                ? {
                    amountMinorUnits: largest.amountMinorUnits.toString(),
                    category: largest.category.name,
                    description: largest.description,
                  }
                : null,
            }),
      },
      byCategory: this.groupDashboardByCategory(activeRecords),
      overTime: this.groupDashboardByDay(activeRecords),
      records: records.map((record) => this.serializeTransaction(record)),
    };
  }

  async findOne(userId: string, familyId: string, id: string) {
    await this.requireMembership(userId, familyId);

    const transaction = await this.prisma.familyTransaction.findFirst({
      where: {
        familyId,
        id,
        OR: [
          { scope: TransactionScope.FAMILY },
          { scope: TransactionScope.PERSONAL, createdById: userId },
        ],
      },
      include: {
        category: { select: { name: true } },
        createdBy: { select: { fullName: true } },
        approvedBy: { select: { fullName: true } },
        receivedFromContact: {
          select: { id: true, fullName: true, phoneNumber: true },
        },
      },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');

    return this.serializeTransaction(transaction);
  }

  async update(
    userId: string,
    familyId: string,
    id: string,
    dto: UpdateTransactionDto,
  ) {
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

    if (
      transaction.scope === TransactionScope.PERSONAL &&
      transaction.createdById !== userId
    ) {
      throw new NotFoundException('Transaction not found');
    }

    const canManageOthers =
      membership.authority === FamilyAuthority.HEAD ||
      membership.authority === FamilyAuthority.ADMIN;
    if (
      transaction.createdById !== userId &&
      (transaction.scope === TransactionScope.PERSONAL || !canManageOthers)
    ) {
      throw new ForbiddenException(
        'You cannot update another member transaction',
      );
    }

    // Rule: "If income is approved, normal users should not edit it. Admin can edit approved income if allowed."
    if (
      transaction.scope === TransactionScope.FAMILY &&
      transaction.status === TransactionStatus.APPROVED
    ) {
      const canEditApproved =
        membership.authority === FamilyAuthority.HEAD ||
        membership.authority === FamilyAuthority.ADMIN;
      if (!canEditApproved) {
        throw new ForbiddenException(
          'Only family heads or admins can edit approved transactions',
        );
      }
    }

    if (dto.type && dto.type !== transaction.type) {
      throw new BadRequestException('Transaction type cannot be changed');
    }

    if (dto.categoryId) {
      await this.requireCategory(familyId, dto.categoryId, transaction.type);
    }

    const data: any = { ...dto };
    if (dto.amountMinorUnits !== undefined) {
      data.amountMinorUnits = BigInt(dto.amountMinorUnits);
    }
    if (dto.date !== undefined) {
      data.date = new Date(dto.date);
    }
    if (dto.description !== undefined) {
      data.description = this.nullableString(dto.description);
    }
    if (dto.paymentMethod !== undefined) {
      data.paymentMethod = this.nullableString(dto.paymentMethod);
    }
    if (dto.notes !== undefined) {
      data.notes = this.nullableString(dto.notes);
    }
    if (dto.receivedFrom !== undefined) {
      data.receivedFrom = this.nullableString(dto.receivedFrom);
    }
    if (dto.receivedFromContactId !== undefined) {
      const receivedFromContact = this.nullableString(dto.receivedFromContactId)
        ? await this.requireContact(familyId, dto.receivedFromContactId)
        : null;

      data.receivedFromContactId = receivedFromContact?.id ?? null;
      if (receivedFromContact && dto.receivedFrom === undefined) {
        data.receivedFrom = receivedFromContact.fullName;
      }
    }
    if (dto.receivedBy !== undefined) {
      data.receivedBy = this.nullableString(dto.receivedBy);
    }

    Object.assign(data, this.buildTrackingData(dto, transaction));

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.familyTransaction.update({
        where: { id },
        data,
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.TRANSACTION_UPDATED,
          before: this.auditSnapshot(transaction),
          after: this.auditSnapshot(updated),
        },
      });

      return this.serializeTransaction(updated);
    });
  }

  async approve(userId: string, familyId: string, id: string) {
    await this.checkApprovalCapability(userId, familyId);

    const transaction = await this.prisma.familyTransaction.findFirst({
      where: { familyId, id, scope: TransactionScope.FAMILY },
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
          action: FamilyAuditAction.TRANSACTION_APPROVED,
          after: {
            id: updated.id,
            status: updated.status,
            approvedById: updated.approvedById,
            approvedAt: updated.approvedAt?.toISOString(),
          },
        },
      });

      return this.serializeTransaction(updated);
    });
  }

  async reject(userId: string, familyId: string, id: string) {
    await this.checkApprovalCapability(userId, familyId);

    const transaction = await this.prisma.familyTransaction.findFirst({
      where: { familyId, id, scope: TransactionScope.FAMILY },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    if (
      transaction.scope === TransactionScope.PERSONAL &&
      transaction.createdById !== userId
    ) {
      throw new NotFoundException('Transaction not found');
    }
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
          action: FamilyAuditAction.TRANSACTION_REJECTED,
          after: {
            id: updated.id,
            status: updated.status,
          },
        },
      });

      return this.serializeTransaction(updated);
    });
  }

  async remove(userId: string, familyId: string, id: string) {
    const membership = await this.requireMembership(userId, familyId);

    const transaction = await this.prisma.familyTransaction.findFirst({
      where: { familyId, id },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    if (
      transaction.scope === TransactionScope.PERSONAL &&
      transaction.createdById !== userId
    ) {
      throw new NotFoundException('Transaction not found');
    }

    const canManageOthers =
      membership.authority === FamilyAuthority.HEAD ||
      membership.authority === FamilyAuthority.ADMIN;
    if (
      transaction.createdById !== userId &&
      (transaction.scope === TransactionScope.PERSONAL || !canManageOthers)
    ) {
      throw new ForbiddenException(
        'You cannot reverse another member transaction',
      );
    }

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
          action: FamilyAuditAction.TRANSACTION_REVERSED,
          after: {
            id: updated.id,
            status: updated.status,
            reversedAt: updated.reversedAt?.toISOString(),
          },
        },
      });

      return this.serializeTransaction(updated);
    });
  }

  private async checkApprovalCapability(userId: string, familyId: string) {
    const membership = await this.requireMembership(userId, familyId);

    if (!can(membership, FamilyCapability.APPROVE_EXPENSE)) {
      throw new ForbiddenException(
        'You do not have permission to approve transactions',
      );
    }
  }

  private async requireMembership(userId: string, familyId: string) {
    const membership = await this.prisma.familyMember.findFirst({
      where: { familyId, userId, removedAt: null },
    });

    if (!membership) {
      throw new ForbiddenException('Not a family member');
    }

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
      throw new ForbiddenException('You cannot record this transaction');
    }
  }

  private async requireCategory(
    familyId: string,
    categoryId: string,
    type: TransactionType,
  ) {
    const category = await this.prisma.familyTransactionCategory.findFirst({
      where: { id: categoryId, familyId, type, status: CategoryStatus.ACTIVE },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException(
        'Select an active category that belongs to this family and transaction type',
      );
    }
  }

  private async requireContact(familyId: string, contactId: string) {
    const contact = await this.prisma.familyContact.findFirst({
      where: {
        id: contactId,
        familyId,
        deletedAt: null,
        status: FamilyContactStatus.ACTIVE,
      },
      select: { id: true, fullName: true },
    });

    if (!contact) {
      throw new BadRequestException(
        'Select an active payer contact that belongs to this family',
      );
    }

    return contact;
  }

  private buildTrackingData(
    dto: CreateTransactionDto | UpdateTransactionDto,
    current?: {
      amountMinorUnits: bigint;
      incomeRecurrence: IncomeRecurrence;
      expectedAmountMinorUnits: bigint | null;
      dueDate: Date | null;
      periodStart: Date | null;
      periodEnd: Date | null;
      propertyName: string | null;
    },
  ) {
    const amountMinorUnits =
      dto.amountMinorUnits !== undefined
        ? BigInt(dto.amountMinorUnits)
        : (current?.amountMinorUnits ?? 0n);

    const expectedAmountMinorUnits =
      dto.expectedAmountMinorUnits !== undefined
        ? BigInt(dto.expectedAmountMinorUnits)
        : (current?.expectedAmountMinorUnits ?? null);

    const hasTrackingInput =
      dto.expectedAmountMinorUnits !== undefined ||
      dto.dueDate !== undefined ||
      dto.periodStart !== undefined ||
      dto.periodEnd !== undefined ||
      dto.propertyName !== undefined;

    const incomeRecurrence =
      dto.incomeRecurrence ??
      current?.incomeRecurrence ??
      (hasTrackingInput ? IncomeRecurrence.MONTHLY : IncomeRecurrence.ONE_TIME);

    if (incomeRecurrence === IncomeRecurrence.ONE_TIME) {
      if (amountMinorUnits <= 0n) {
        throw new BadRequestException(
          'amountMinorUnits must be greater than zero for one-time income',
        );
      }

      return {
        incomeRecurrence,
        paymentStatus: IncomePaymentStatus.NOT_EXPECTED,
        expectedAmountMinorUnits: null,
        dueDate: null,
        periodStart: null,
        periodEnd: null,
        propertyName: null,
      };
    }

    if (!expectedAmountMinorUnits || expectedAmountMinorUnits <= 0n) {
      throw new BadRequestException(
        'expectedAmountMinorUnits is required for monthly income tracking',
      );
    }

    const dueDate =
      dto.dueDate !== undefined
        ? new Date(dto.dueDate)
        : (current?.dueDate ?? null);

    if (!dueDate) {
      throw new BadRequestException('dueDate is required for monthly income');
    }

    const periodStart =
      dto.periodStart !== undefined
        ? new Date(dto.periodStart)
        : (current?.periodStart ?? null);
    const periodEnd =
      dto.periodEnd !== undefined
        ? new Date(dto.periodEnd)
        : (current?.periodEnd ?? null);

    if (periodStart && periodEnd && periodEnd < periodStart) {
      throw new BadRequestException('periodEnd cannot be before periodStart');
    }

    return {
      incomeRecurrence,
      expectedAmountMinorUnits,
      dueDate,
      periodStart,
      periodEnd,
      propertyName:
        dto.propertyName !== undefined
          ? this.nullableString(dto.propertyName)
          : current?.propertyName,
      paymentStatus: this.resolvePaymentStatus(
        amountMinorUnits,
        expectedAmountMinorUnits,
      ),
    };
  }

  private resolvePaymentStatus(paid: bigint, expected: bigint) {
    if (paid === 0n) return IncomePaymentStatus.UNPAID;
    if (paid < expected) return IncomePaymentStatus.PARTIAL;
    if (paid === expected) return IncomePaymentStatus.PAID;
    return IncomePaymentStatus.OVERPAID;
  }

  private resolveDashboardPeriod(fromValue?: string, toValue?: string) {
    const now = new Date();
    const from = fromValue
      ? this.parseDashboardDate(fromValue)
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to = toValue
      ? this.parseDashboardDate(toValue)
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

    if (to < from) {
      throw new BadRequestException('to must be on or after from');
    }

    if (to.getTime() - from.getTime() > 366 * 86400000) {
      throw new BadRequestException('Dashboard periods cannot exceed 366 days');
    }

    return { from, toExclusive: new Date(to.getTime() + 86400000) };
  }

  private parseDashboardDate(value: string) {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  }

  private groupDashboardByCategory(
    records: Array<{
      amountMinorUnits: bigint;
      category: { name: string };
    }>,
  ) {
    const totals = new Map<string, bigint>();
    for (const record of records) {
      totals.set(
        record.category.name,
        (totals.get(record.category.name) ?? 0n) + record.amountMinorUnits,
      );
    }

    return Array.from(totals, ([category, amountMinorUnits]) => ({
      category,
      amountMinorUnits: amountMinorUnits.toString(),
    })).sort((left, right) =>
      BigInt(right.amountMinorUnits) > BigInt(left.amountMinorUnits) ? 1 : -1,
    );
  }

  private groupDashboardByDay(
    records: Array<{ amountMinorUnits: bigint; date: Date }>,
  ) {
    const totals = new Map<string, bigint>();
    for (const record of records) {
      const date = this.dateKey(record.date);
      totals.set(date, (totals.get(date) ?? 0n) + record.amountMinorUnits);
    }

    return Array.from(totals, ([date, amountMinorUnits]) => ({
      date,
      amountMinorUnits: amountMinorUnits.toString(),
    })).sort((left, right) => left.date.localeCompare(right.date));
  }

  private dateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private nullableString(value: string | null | undefined) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private serializeTransaction<T extends Record<string, any>>(transaction: T) {
    return {
      ...transaction,
      amountMinorUnits: transaction.amountMinorUnits.toString(),
      expectedAmountMinorUnits:
        transaction.expectedAmountMinorUnits === null ||
        transaction.expectedAmountMinorUnits === undefined
          ? null
          : transaction.expectedAmountMinorUnits.toString(),
    };
  }

  private auditSnapshot(transaction: Record<string, any>) {
    return {
      id: transaction.id,
      categoryId: transaction.categoryId,
      amountMinorUnits: transaction.amountMinorUnits.toString(),
      expectedAmountMinorUnits:
        transaction.expectedAmountMinorUnits === null ||
        transaction.expectedAmountMinorUnits === undefined
          ? null
          : transaction.expectedAmountMinorUnits.toString(),
      type: transaction.type,
      scope: transaction.scope,
      status: transaction.status,
      incomeRecurrence: transaction.incomeRecurrence,
      paymentStatus: transaction.paymentStatus,
      date: transaction.date.toISOString(),
      dueDate: transaction.dueDate?.toISOString?.() ?? null,
      periodStart: transaction.periodStart?.toISOString?.() ?? null,
      periodEnd: transaction.periodEnd?.toISOString?.() ?? null,
      propertyName: transaction.propertyName,
      description: transaction.description,
      paymentMethod: transaction.paymentMethod,
      notes: transaction.notes,
      receivedFrom: transaction.receivedFrom,
      receivedFromContactId: transaction.receivedFromContactId,
      receivedBy: transaction.receivedBy,
    };
  }
}
