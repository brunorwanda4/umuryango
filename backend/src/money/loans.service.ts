import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryStatus,
  FamilyAuthority,
  FamilyCapability,
  type FamilyContact,
  type FamilyLoan,
  type FamilyLoanRepayment,
  LoanApprovalStatus,
  LoanAuditAction,
  LoanInterestType,
  LoanStatus,
  LoanType,
  Prisma,
  TransactionScope,
  TransactionType,
} from '@prisma/client';
import { can } from '../families/family-access';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { LoanQueryDto } from './dto/loan-query.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { UpdateRepaymentDto } from './dto/update-repayment.dto';
import { UploadLoanDocumentDto } from './dto/upload-loan-document.dto';

type TxClient = Prisma.TransactionClient;

type Membership = {
  id: string;
  userId: string;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  family: { defaultCurrency: string };
};

const ACTIVE_LOAN_STATUSES: LoanStatus[] = [
  LoanStatus.ACTIVE,
  LoanStatus.OVERDUE,
];

const LOAN_INCLUDE = Prisma.validator<Prisma.FamilyLoanInclude>()({
  borrowerMember: { include: { user: { select: { fullName: true } } } },
  borrowerContact: {
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      relationshipToFamily: true,
      organization: true,
    },
  },
  lenderMember: { include: { user: { select: { fullName: true } } } },
  lenderContact: {
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      relationshipToFamily: true,
      organization: true,
    },
  },
  category: { select: { id: true, name: true, type: true } },
  createdBy: { select: { fullName: true } },
  updatedBy: { select: { fullName: true } },
  approvedBy: { select: { fullName: true } },
  _count: {
    select: {
      repayments: { where: { deletedAt: null } },
      documents: { where: { deletedAt: null } },
      auditLogs: true,
    },
  },
  auditLogs: {
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { performedBy: { select: { fullName: true } } },
  },
});

const REPAYMENT_INCLUDE = Prisma.validator<Prisma.FamilyLoanRepaymentInclude>()(
  {
    paidByMember: { include: { user: { select: { fullName: true } } } },
    receivedByMember: { include: { user: { select: { fullName: true } } } },
    receipt: { select: { id: true, fileName: true, fileType: true } },
    createdBy: { select: { fullName: true } },
  },
);

const DOCUMENT_INCLUDE = Prisma.validator<Prisma.FamilyLoanDocumentInclude>()({
  uploadedBy: { select: { fullName: true } },
});

type LoanWithRelations = Prisma.FamilyLoanGetPayload<{
  include: typeof LOAN_INCLUDE;
}>;

type RepaymentWithRelations = Prisma.FamilyLoanRepaymentGetPayload<{
  include: typeof REPAYMENT_INCLUDE;
}>;

type DocumentWithUploader = Prisma.FamilyLoanDocumentGetPayload<{
  include: typeof DOCUMENT_INCLUDE;
}>;

@Injectable()
export class LoansService {
  constructor(private readonly prisma: PrismaService) {}

  async createLoan(userId: string, familyId: string, dto: CreateLoanDto) {
    const membership = await this.requireMembership(userId, familyId);

    if (dto.idempotencyKey) {
      const existing = await this.prisma.familyLoan.findUnique({
        where: {
          familyId_idempotencyKey: {
            familyId,
            idempotencyKey: dto.idempotencyKey,
          },
        },
        include: this.loanInclude(),
      });
      if (existing && this.canViewLoan(membership, existing)) {
        return this.serializeLoan(existing);
      }
    }

    const startDate = this.toDate(dto.startDate, 'startDate');
    const dueDate = this.toDate(dto.dueDate, 'dueDate');
    if (dueDate <= startDate) {
      throw new BadRequestException('dueDate must be after startDate.');
    }

    await this.assertMembersBelong(familyId, [
      dto.borrowerMemberId,
      dto.lenderMemberId,
    ]);
    await this.assertLoanCategory(familyId, dto.categoryId, dto.loanType);
    const contacts = await this.getLoanContacts(familyId, {
      borrowerContactId: dto.borrowerContactId,
      lenderContactId: dto.lenderContactId,
    });
    this.assertRequiredCounterparty(dto.loanType, {
      borrowerName: dto.borrowerName,
      borrowerContact: contacts.borrowerContact,
      lenderName: dto.lenderName,
      lenderContact: contacts.lenderContact,
    });

    const principal = BigInt(dto.principalAmountMinorUnits);
    const interestRate = dto.interestRate ?? '0';
    const totalExpected = this.calculateTotalExpectedAmount(
      principal,
      dto.interestType,
      interestRate,
    );

    const loan = await this.prisma.$transaction(async (tx) => {
      const created = await tx.familyLoan.create({
        data: {
          familyId,
          title: dto.title,
          description: dto.description || null,
          loanType: dto.loanType,
          principalAmountMinorUnits: principal,
          interestRate,
          interestType: dto.interestType,
          totalExpectedAmountMinorUnits: totalExpected,
          paidAmountMinorUnits: 0n,
          remainingBalanceMinorUnits: totalExpected,
          currency: dto.currency ?? membership.family.defaultCurrency,
          borrowerName:
            contacts.borrowerContact?.fullName ?? dto.borrowerName ?? null,
          borrowerMemberId: dto.borrowerMemberId || null,
          borrowerContactId: contacts.borrowerContact?.id ?? null,
          lenderName:
            contacts.lenderContact?.fullName ?? dto.lenderName ?? null,
          lenderMemberId: dto.lenderMemberId || null,
          lenderContactId: contacts.lenderContact?.id ?? null,
          categoryId: dto.categoryId || null,
          startDate,
          dueDate,
          repaymentFrequency: dto.repaymentFrequency,
          createdById: userId,
          idempotencyKey: dto.idempotencyKey || null,
        },
        include: this.loanInclude(),
      });

      await this.createAuditLog(
        tx,
        created.id,
        userId,
        LoanAuditAction.CREATED,
        {
          newValue: this.loanSnapshot(created),
          description: 'Loan request created.',
        },
      );

      return created;
    });

    return this.serializeLoan(loan);
  }

  async updateLoan(
    userId: string,
    familyId: string,
    id: string,
    dto: UpdateLoanDto,
  ) {
    const membership = await this.requireMembership(userId, familyId);
    const loan = await this.findLoanRecord(familyId, id);
    this.assertCanMutateLoan(membership, loan, 'update');
    this.assertLoanIsEditable(loan);

    const nextLoanType = dto.loanType ?? loan.loanType;
    await this.assertMembersBelong(familyId, [
      dto.borrowerMemberId,
      dto.lenderMemberId,
    ]);
    await this.assertLoanCategory(familyId, dto.categoryId, nextLoanType);
    const contacts = await this.getLoanContacts(familyId, {
      borrowerContactId:
        dto.borrowerContactId === undefined
          ? loan.borrowerContactId
          : dto.borrowerContactId,
      lenderContactId:
        dto.lenderContactId === undefined
          ? loan.lenderContactId
          : dto.lenderContactId,
    });
    this.assertRequiredCounterparty(nextLoanType, {
      borrowerName:
        contacts.borrowerContact?.fullName ??
        dto.borrowerName ??
        loan.borrowerName,
      borrowerContact: contacts.borrowerContact,
      lenderName:
        contacts.lenderContact?.fullName ?? dto.lenderName ?? loan.lenderName,
      lenderContact: contacts.lenderContact,
    });

    const nextStartDate = dto.startDate
      ? this.toDate(dto.startDate, 'startDate')
      : loan.startDate;
    const nextDueDate = dto.dueDate
      ? this.toDate(dto.dueDate, 'dueDate')
      : loan.dueDate;
    if (nextDueDate <= nextStartDate) {
      throw new BadRequestException('dueDate must be after startDate.');
    }

    const principal = dto.principalAmountMinorUnits
      ? BigInt(dto.principalAmountMinorUnits)
      : loan.principalAmountMinorUnits;
    const interestType = dto.interestType ?? loan.interestType;
    const interestRate = dto.interestRate ?? loan.interestRate.toString();
    const totalExpected = this.calculateTotalExpectedAmount(
      principal,
      interestType,
      interestRate,
    );
    if (totalExpected < loan.paidAmountMinorUnits) {
      throw new BadRequestException(
        'Updated expected amount cannot be less than paid amount.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const before = this.loanSnapshot(loan);
      const data: Prisma.FamilyLoanUpdateInput = {
        updatedBy: { connect: { id: userId } },
        remainingBalanceMinorUnits: totalExpected - loan.paidAmountMinorUnits,
        totalExpectedAmountMinorUnits: totalExpected,
        status: this.resolveLoanStatus({
          approvalStatus: loan.approvalStatus,
          dueDate: nextDueDate,
          remainingBalanceMinorUnits: totalExpected - loan.paidAmountMinorUnits,
          currentStatus: loan.status,
        }),
      };

      if (dto.title !== undefined) data.title = dto.title;
      if (dto.description !== undefined)
        data.description = dto.description || null;
      if (dto.loanType !== undefined) data.loanType = dto.loanType;
      if (dto.principalAmountMinorUnits !== undefined) {
        data.principalAmountMinorUnits = principal;
      }
      if (dto.interestRate !== undefined || dto.interestType !== undefined) {
        data.interestRate = interestRate;
        data.interestType = interestType;
      }
      if (dto.currency !== undefined) data.currency = dto.currency;
      if (dto.borrowerName !== undefined || dto.borrowerContactId !== undefined)
        data.borrowerName =
          contacts.borrowerContact?.fullName ?? dto.borrowerName ?? null;
      if (dto.borrowerMemberId !== undefined) {
        data.borrowerMember =
          dto.borrowerMemberId === null || dto.borrowerMemberId === ''
            ? { disconnect: true }
            : { connect: { id: dto.borrowerMemberId } };
      }
      if (dto.borrowerContactId !== undefined) {
        data.borrowerContact =
          dto.borrowerContactId === null || dto.borrowerContactId === ''
            ? { disconnect: true }
            : { connect: { id: dto.borrowerContactId } };
      }
      if (dto.lenderName !== undefined || dto.lenderContactId !== undefined)
        data.lenderName =
          contacts.lenderContact?.fullName ?? dto.lenderName ?? null;
      if (dto.lenderMemberId !== undefined) {
        data.lenderMember =
          dto.lenderMemberId === null || dto.lenderMemberId === ''
            ? { disconnect: true }
            : { connect: { id: dto.lenderMemberId } };
      }
      if (dto.lenderContactId !== undefined) {
        data.lenderContact =
          dto.lenderContactId === null || dto.lenderContactId === ''
            ? { disconnect: true }
            : { connect: { id: dto.lenderContactId } };
      }
      if (dto.categoryId !== undefined) {
        data.category =
          dto.categoryId === null || dto.categoryId === ''
            ? { disconnect: true }
            : { connect: { id: dto.categoryId } };
      }
      if (dto.startDate !== undefined) data.startDate = nextStartDate;
      if (dto.dueDate !== undefined) data.dueDate = nextDueDate;
      if (dto.repaymentFrequency !== undefined) {
        data.repaymentFrequency = dto.repaymentFrequency;
      }
      if (dto.idempotencyKey !== undefined) {
        data.idempotencyKey = dto.idempotencyKey || null;
      }

      const saved = await tx.familyLoan.update({
        where: { id },
        data,
        include: this.loanInclude(),
      });
      await this.createAuditLog(tx, id, userId, LoanAuditAction.UPDATED, {
        oldValue: before,
        newValue: this.loanSnapshot(saved),
        description: 'Loan updated.',
      });
      return saved;
    });

    return this.serializeLoan(updated);
  }

  async deleteLoan(userId: string, familyId: string, id: string) {
    const membership = await this.requireMembership(userId, familyId);
    const loan = await this.findLoanRecord(familyId, id);
    this.assertCanMutateLoan(membership, loan, 'delete');
    if (loan.status === LoanStatus.COMPLETED) {
      throw new BadRequestException('Completed loans are read-only.');
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.familyLoan.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: LoanStatus.CANCELLED,
          approvalStatus: LoanApprovalStatus.CANCELLED,
          updatedById: userId,
        },
        include: this.loanInclude(),
      });
      await this.createAuditLog(tx, id, userId, LoanAuditAction.DELETED, {
        oldValue: this.loanSnapshot(loan),
        newValue: this.loanSnapshot(saved),
        description: 'Loan soft deleted.',
      });
      return saved;
    });

    return this.serializeLoan(deleted);
  }

  async findLoans(userId: string, familyId: string, query: LoanQueryDto) {
    const membership = await this.requireMembership(userId, familyId);
    await this.refreshOverdueLoans(familyId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.FamilyLoanWhereInput = {
      familyId,
      deletedAt: null,
      ...this.accessWhere(membership),
    };
    if (query.loanType) where.loanType = query.loanType;
    if (query.status) where.status = query.status;
    if (query.approvalStatus) where.approvalStatus = query.approvalStatus;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.dueFrom || query.dueTo) {
      where.dueDate = {
        ...(query.dueFrom
          ? { gte: this.toDate(query.dueFrom, 'dueFrom') }
          : {}),
        ...(query.dueTo ? { lte: this.toDate(query.dueTo, 'dueTo') } : {}),
      };
    }
    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { borrowerName: { contains: search, mode: 'insensitive' } },
        { lenderName: { contains: search, mode: 'insensitive' } },
        {
          borrowerContact: {
            fullName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          lenderContact: {
            fullName: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.familyLoan.findMany({
        where,
        include: this.loanInclude(),
        orderBy: {
          [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.familyLoan.count({ where }),
    ]);

    return {
      items: items.map((loan) => this.serializeLoan(loan)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findLoan(userId: string, familyId: string, id: string) {
    const membership = await this.requireMembership(userId, familyId);
    await this.refreshOverdueLoans(familyId);
    const loan = await this.findLoanRecord(familyId, id);
    if (!this.canViewLoan(membership, loan)) {
      throw new ForbiddenException('You cannot view this loan.');
    }
    return this.serializeLoan(loan);
  }

  async getLoanSummary(userId: string, familyId: string) {
    const membership = await this.requireMembership(userId, familyId);
    await this.refreshOverdueLoans(familyId);

    const where: Prisma.FamilyLoanWhereInput = {
      familyId,
      deletedAt: null,
      ...this.accessWhere(membership),
    };
    const loans = await this.prisma.familyLoan.findMany({ where });

    const totals = loans.reduce(
      (acc, loan) => {
        acc.principal += loan.principalAmountMinorUnits;
        acc.expected += loan.totalExpectedAmountMinorUnits;
        acc.paid += loan.paidAmountMinorUnits;
        acc.remaining += loan.remainingBalanceMinorUnits;
        if (loan.loanType === LoanType.BORROWED) {
          acc.borrowedRemaining += loan.remainingBalanceMinorUnits;
        } else {
          acc.lentRemaining += loan.remainingBalanceMinorUnits;
        }
        if (loan.status === LoanStatus.OVERDUE) acc.overdueCount += 1;
        if (loan.status === LoanStatus.COMPLETED) acc.completedCount += 1;
        if (loan.approvalStatus === LoanApprovalStatus.PENDING) {
          acc.pendingApprovalCount += 1;
        }
        return acc;
      },
      {
        principal: 0n,
        expected: 0n,
        paid: 0n,
        remaining: 0n,
        borrowedRemaining: 0n,
        lentRemaining: 0n,
        overdueCount: 0,
        completedCount: 0,
        pendingApprovalCount: 0,
      },
    );

    return {
      currency: membership.family.defaultCurrency,
      generatedAt: new Date().toISOString(),
      loanCount: loans.length,
      activeLoanCount: loans.filter((loan) =>
        ACTIVE_LOAN_STATUSES.includes(loan.status),
      ).length,
      overdueLoanCount: totals.overdueCount,
      completedLoanCount: totals.completedCount,
      pendingApprovalCount: totals.pendingApprovalCount,
      principalAmountMinorUnits: totals.principal.toString(),
      totalExpectedAmountMinorUnits: totals.expected.toString(),
      paidAmountMinorUnits: totals.paid.toString(),
      remainingBalanceMinorUnits: totals.remaining.toString(),
      borrowedRemainingMinorUnits: totals.borrowedRemaining.toString(),
      lentRemainingMinorUnits: totals.lentRemaining.toString(),
    };
  }

  async submitForApproval(userId: string, familyId: string, id: string) {
    const membership = await this.requireMembership(userId, familyId);
    const loan = await this.findLoanRecord(familyId, id);
    this.assertCanMutateLoan(membership, loan, 'submit');
    if (loan.approvalStatus !== LoanApprovalStatus.DRAFT) {
      throw new BadRequestException('Only draft loans can be submitted.');
    }

    return this.transitionLoan(userId, id, loan, {
      data: { approvalStatus: LoanApprovalStatus.PENDING, updatedById: userId },
      action: LoanAuditAction.SUBMITTED_FOR_APPROVAL,
      description: 'Loan submitted for approval.',
    });
  }

  async approveLoan(userId: string, familyId: string, id: string) {
    const membership = await this.requireMembership(userId, familyId);
    this.requireLoanManager(membership, 'approve loans');
    const loan = await this.findLoanRecord(familyId, id);
    if (loan.approvalStatus !== LoanApprovalStatus.PENDING) {
      throw new BadRequestException('Only pending loans can be approved.');
    }

    return this.transitionLoan(userId, id, loan, {
      data: {
        approvalStatus: LoanApprovalStatus.APPROVED,
        status: this.resolveLoanStatus({
          approvalStatus: LoanApprovalStatus.APPROVED,
          dueDate: loan.dueDate,
          remainingBalanceMinorUnits: loan.remainingBalanceMinorUnits,
          currentStatus: loan.status,
        }),
        approvedById: userId,
        approvedAt: new Date(),
        updatedById: userId,
      },
      action: LoanAuditAction.APPROVED,
      description: 'Loan approved.',
    });
  }

  async rejectLoan(userId: string, familyId: string, id: string) {
    const membership = await this.requireMembership(userId, familyId);
    this.requireLoanManager(membership, 'reject loans');
    const loan = await this.findLoanRecord(familyId, id);
    if (loan.approvalStatus !== LoanApprovalStatus.PENDING) {
      throw new BadRequestException('Only pending loans can be rejected.');
    }

    return this.transitionLoan(userId, id, loan, {
      data: {
        approvalStatus: LoanApprovalStatus.REJECTED,
        status: LoanStatus.DRAFT,
        updatedById: userId,
      },
      action: LoanAuditAction.CANCELLED,
      description: 'Loan rejected.',
    });
  }

  async cancelLoan(userId: string, familyId: string, id: string) {
    const membership = await this.requireMembership(userId, familyId);
    const loan = await this.findLoanRecord(familyId, id);
    this.assertCanMutateLoan(membership, loan, 'cancel');
    if (loan.status === LoanStatus.COMPLETED) {
      throw new BadRequestException('Completed loans are read-only.');
    }

    return this.transitionLoan(userId, id, loan, {
      data: {
        status: LoanStatus.CANCELLED,
        approvalStatus: LoanApprovalStatus.CANCELLED,
        updatedById: userId,
      },
      action: LoanAuditAction.CANCELLED,
      description: 'Loan cancelled.',
    });
  }

  async markCompleted(userId: string, familyId: string, id: string) {
    const membership = await this.requireMembership(userId, familyId);
    this.requireLoanManager(membership, 'mark loans completed');
    const loan = await this.findLoanRecord(familyId, id);
    if (loan.remainingBalanceMinorUnits > 0n) {
      throw new BadRequestException(
        'Loan cannot be completed while it has a remaining balance.',
      );
    }

    return this.transitionLoan(userId, id, loan, {
      data: { status: LoanStatus.COMPLETED, updatedById: userId },
      action: LoanAuditAction.COMPLETED,
      description: 'Loan marked completed.',
    });
  }

  async getRepayments(userId: string, familyId: string, loanId: string) {
    const membership = await this.requireMembership(userId, familyId);
    const loan = await this.findLoanRecord(familyId, loanId);
    if (!this.canViewLoan(membership, loan)) {
      throw new ForbiddenException('You cannot view this loan.');
    }

    const repayments = await this.prisma.familyLoanRepayment.findMany({
      where: { familyId, loanId, deletedAt: null },
      include: this.repaymentInclude(),
      orderBy: { paymentDate: 'desc' },
    });

    return repayments.map((repayment) => this.serializeRepayment(repayment));
  }

  async addRepayment(
    userId: string,
    familyId: string,
    loanId: string,
    dto: CreateRepaymentDto,
  ) {
    const membership = await this.requireMembership(userId, familyId);
    const loan = await this.findLoanRecord(familyId, loanId);
    this.assertCanRepay(membership, loan);
    this.assertLoanCanReceiveRepayments(loan);

    if (dto.idempotencyKey) {
      const existing = await this.prisma.familyLoanRepayment.findUnique({
        where: {
          familyId_idempotencyKey: {
            familyId,
            idempotencyKey: dto.idempotencyKey,
          },
        },
        include: this.repaymentInclude(),
      });
      if (existing) return this.serializeRepayment(existing);
    }

    await this.assertMembersBelong(familyId, [
      dto.paidByMemberId,
      dto.receivedByMemberId,
    ]);
    await this.assertReceiptBelongs(familyId, dto.receiptId);

    const amount = BigInt(dto.amountMinorUnits);
    if (amount > loan.remainingBalanceMinorUnits) {
      throw new BadRequestException('Repayment exceeds remaining balance.');
    }

    return this.prisma.$transaction(async (tx) => {
      const repayment = await tx.familyLoanRepayment.create({
        data: {
          loanId,
          familyId,
          amountMinorUnits: amount,
          paymentDate: this.toDate(dto.paymentDate, 'paymentDate'),
          paymentMethod: dto.paymentMethod,
          paidByMemberId: dto.paidByMemberId || null,
          receivedByMemberId: dto.receivedByMemberId || null,
          receiptId: dto.receiptId || null,
          notes: dto.notes || null,
          idempotencyKey: dto.idempotencyKey || null,
          createdById: userId,
        },
        include: this.repaymentInclude(),
      });

      const updatedLoan = await this.recalculateLoanBalance(tx, loanId);
      await this.createAuditLog(
        tx,
        loanId,
        userId,
        LoanAuditAction.REPAYMENT_CREATED,
        {
          newValue: this.repaymentSnapshot(repayment),
          description: 'Loan repayment recorded.',
        },
      );

      return {
        repayment: this.serializeRepayment(repayment),
        loan: this.serializeLoan(updatedLoan),
      };
    });
  }

  async updateRepayment(
    userId: string,
    familyId: string,
    loanId: string,
    repaymentId: string,
    dto: UpdateRepaymentDto,
  ) {
    const membership = await this.requireMembership(userId, familyId);
    const loan = await this.findLoanRecord(familyId, loanId);
    this.assertCanRepay(membership, loan);
    this.assertLoanCanReceiveRepayments(loan);
    const repayment = await this.findRepaymentRecord(
      familyId,
      loanId,
      repaymentId,
    );

    await this.assertMembersBelong(familyId, [
      dto.paidByMemberId,
      dto.receivedByMemberId,
    ]);
    await this.assertReceiptBelongs(familyId, dto.receiptId);

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.FamilyLoanRepaymentUpdateInput = {};
      if (dto.amountMinorUnits !== undefined) {
        data.amountMinorUnits = BigInt(dto.amountMinorUnits);
      }
      if (dto.paymentDate !== undefined) {
        data.paymentDate = this.toDate(dto.paymentDate, 'paymentDate');
      }
      if (dto.paymentMethod !== undefined)
        data.paymentMethod = dto.paymentMethod;
      if (dto.notes !== undefined) data.notes = dto.notes || null;
      if (dto.idempotencyKey !== undefined) {
        data.idempotencyKey = dto.idempotencyKey || null;
      }
      if (dto.paidByMemberId !== undefined) {
        data.paidByMember =
          dto.paidByMemberId === null || dto.paidByMemberId === ''
            ? { disconnect: true }
            : { connect: { id: dto.paidByMemberId } };
      }
      if (dto.receivedByMemberId !== undefined) {
        data.receivedByMember =
          dto.receivedByMemberId === null || dto.receivedByMemberId === ''
            ? { disconnect: true }
            : { connect: { id: dto.receivedByMemberId } };
      }
      if (dto.receiptId !== undefined) {
        data.receipt =
          dto.receiptId === null || dto.receiptId === ''
            ? { disconnect: true }
            : { connect: { id: dto.receiptId } };
      }

      const updated = await tx.familyLoanRepayment.update({
        where: { id: repaymentId },
        data,
        include: this.repaymentInclude(),
      });
      const updatedLoan = await this.recalculateLoanBalance(tx, loanId);
      if (updatedLoan.remainingBalanceMinorUnits < 0n) {
        throw new BadRequestException('Repayment exceeds remaining balance.');
      }

      await this.createAuditLog(
        tx,
        loanId,
        userId,
        LoanAuditAction.REPAYMENT_UPDATED,
        {
          oldValue: this.repaymentSnapshot(repayment),
          newValue: this.repaymentSnapshot(updated),
          description: 'Loan repayment updated.',
        },
      );

      return {
        repayment: this.serializeRepayment(updated),
        loan: this.serializeLoan(updatedLoan),
      };
    });
  }

  async deleteRepayment(
    userId: string,
    familyId: string,
    loanId: string,
    repaymentId: string,
  ) {
    const membership = await this.requireMembership(userId, familyId);
    const loan = await this.findLoanRecord(familyId, loanId);
    this.assertCanRepay(membership, loan);
    this.assertLoanCanReceiveRepayments(loan);
    const repayment = await this.findRepaymentRecord(
      familyId,
      loanId,
      repaymentId,
    );

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.familyLoanRepayment.update({
        where: { id: repaymentId },
        data: { deletedAt: new Date() },
        include: this.repaymentInclude(),
      });
      const updatedLoan = await this.recalculateLoanBalance(tx, loanId);
      await this.createAuditLog(
        tx,
        loanId,
        userId,
        LoanAuditAction.REPAYMENT_DELETED,
        {
          oldValue: this.repaymentSnapshot(repayment),
          newValue: this.repaymentSnapshot(deleted),
          description: 'Loan repayment soft deleted.',
        },
      );

      return {
        repayment: this.serializeRepayment(deleted),
        loan: this.serializeLoan(updatedLoan),
      };
    });
  }

  async uploadLoanDocument(
    userId: string,
    familyId: string,
    loanId: string,
    dto: UploadLoanDocumentDto,
  ) {
    const membership = await this.requireMembership(userId, familyId);
    const loan = await this.findLoanRecord(familyId, loanId);
    this.assertCanMutateLoan(membership, loan, 'upload documents to');
    this.assertLoanIsEditable(loan);

    const document = await this.prisma.$transaction(async (tx) => {
      const created = await tx.familyLoanDocument.create({
        data: {
          loanId,
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          fileType: dto.fileType,
          fileSizeBytes: dto.fileSizeBytes,
          uploadedById: userId,
        },
        include: DOCUMENT_INCLUDE,
      });
      await this.createAuditLog(
        tx,
        loanId,
        userId,
        LoanAuditAction.DOCUMENT_UPLOADED,
        {
          newValue: {
            id: created.id,
            fileName: created.fileName,
            fileType: created.fileType,
          },
          description: 'Loan document uploaded.',
        },
      );
      return created;
    });

    return this.serializeDocument(document);
  }

  async getLoanDocuments(userId: string, familyId: string, loanId: string) {
    const membership = await this.requireMembership(userId, familyId);
    const loan = await this.findLoanRecord(familyId, loanId);
    if (!this.canViewLoan(membership, loan)) {
      throw new ForbiddenException('You cannot view this loan.');
    }

    const documents = await this.prisma.familyLoanDocument.findMany({
      where: { loanId, deletedAt: null },
      include: DOCUMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((document) => this.serializeDocument(document));
  }

  async deleteLoanDocument(
    userId: string,
    familyId: string,
    loanId: string,
    documentId: string,
  ) {
    const membership = await this.requireMembership(userId, familyId);
    const loan = await this.findLoanRecord(familyId, loanId);
    this.assertCanMutateLoan(membership, loan, 'delete documents from');
    this.assertLoanIsEditable(loan);

    const document = await this.prisma.familyLoanDocument.findFirst({
      where: { id: documentId, loanId, deletedAt: null },
      include: DOCUMENT_INCLUDE,
    });
    if (!document) throw new NotFoundException('Loan document not found.');

    const deleted = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.familyLoanDocument.update({
        where: { id: documentId },
        data: { deletedAt: new Date() },
        include: DOCUMENT_INCLUDE,
      });
      await this.createAuditLog(
        tx,
        loanId,
        userId,
        LoanAuditAction.DOCUMENT_DELETED,
        {
          oldValue: {
            id: document.id,
            fileName: document.fileName,
            fileType: document.fileType,
          },
          newValue: { id: saved.id, deletedAt: saved.deletedAt?.toISOString() },
          description: 'Loan document soft deleted.',
        },
      );
      return saved;
    });

    return this.serializeDocument(deleted);
  }

  async recalculateLoanBalance(tx: TxClient, loanId: string) {
    const loan = await tx.familyLoan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found.');

    const repayments = await tx.familyLoanRepayment.findMany({
      where: { loanId, deletedAt: null },
      select: { amountMinorUnits: true },
    });
    const paid = repayments.reduce(
      (sum, repayment) => sum + repayment.amountMinorUnits,
      0n,
    );
    const remaining = loan.totalExpectedAmountMinorUnits - paid;
    if (remaining < 0n) {
      throw new BadRequestException('Repayments exceed expected loan amount.');
    }
    const status = this.resolveLoanStatus({
      approvalStatus: loan.approvalStatus,
      dueDate: loan.dueDate,
      remainingBalanceMinorUnits: remaining,
      currentStatus: loan.status,
    });

    return tx.familyLoan.update({
      where: { id: loanId },
      data: {
        paidAmountMinorUnits: paid,
        remainingBalanceMinorUnits: remaining,
        status,
      },
      include: this.loanInclude(),
    });
  }

  async createAuditLog(
    tx: TxClient,
    loanId: string,
    performedById: string,
    action: LoanAuditAction,
    details: {
      oldValue?: Prisma.InputJsonValue;
      newValue?: Prisma.InputJsonValue;
      description?: string;
    },
  ) {
    return tx.familyLoanAuditLog.create({
      data: {
        loanId,
        action,
        oldValue: details.oldValue ?? Prisma.JsonNull,
        newValue: details.newValue ?? Prisma.JsonNull,
        description: details.description,
        performedById,
      },
    });
  }

  private async transitionLoan(
    userId: string,
    id: string,
    loan: FamilyLoan,
    transition: {
      data: Prisma.FamilyLoanUncheckedUpdateInput;
      action: LoanAuditAction;
      description: string;
    },
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.familyLoan.update({
        where: { id },
        data: transition.data,
        include: this.loanInclude(),
      });
      await this.createAuditLog(tx, id, userId, transition.action, {
        oldValue: this.loanSnapshot(loan),
        newValue: this.loanSnapshot(saved),
        description: transition.description,
      });
      return saved;
    });

    return this.serializeLoan(updated);
  }

  private async requireMembership(
    userId: string,
    familyId: string,
  ): Promise<Membership> {
    const membership = await this.prisma.familyMember.findFirst({
      where: { familyId, userId, removedAt: null },
      include: { family: { select: { defaultCurrency: true } } },
    });
    if (!membership) throw new NotFoundException('Family not found.');
    return membership;
  }

  private requireLoanManager(membership: Membership, action: string) {
    if (!this.isLoanManager(membership)) {
      throw new ForbiddenException(`You cannot ${action}.`);
    }
  }

  private isLoanManager(membership: Membership) {
    return (
      membership.authority === FamilyAuthority.HEAD ||
      membership.authority === FamilyAuthority.ADMIN ||
      can(membership, FamilyCapability.MANAGE_DEBTS)
    );
  }

  private canViewLoan(membership: Membership, loan: FamilyLoan) {
    return (
      this.isLoanManager(membership) ||
      loan.createdById === membership.userId ||
      loan.borrowerMemberId === membership.id ||
      loan.lenderMemberId === membership.id
    );
  }

  private accessWhere(membership: Membership): Prisma.FamilyLoanWhereInput {
    if (this.isLoanManager(membership)) return {};
    return {
      OR: [
        { createdById: membership.userId },
        { borrowerMemberId: membership.id },
        { lenderMemberId: membership.id },
      ],
    };
  }

  private assertCanMutateLoan(
    membership: Membership,
    loan: FamilyLoan,
    action: string,
  ) {
    if (this.isLoanManager(membership)) return;
    if (
      loan.createdById === membership.userId &&
      (loan.approvalStatus === LoanApprovalStatus.DRAFT ||
        loan.approvalStatus === LoanApprovalStatus.REJECTED)
    ) {
      return;
    }
    throw new ForbiddenException(`You cannot ${action} this loan.`);
  }

  private assertCanRepay(membership: Membership, loan: FamilyLoan) {
    if (this.canViewLoan(membership, loan)) return;
    throw new ForbiddenException('You cannot record repayments for this loan.');
  }

  private assertLoanIsEditable(loan: FamilyLoan) {
    if (loan.status === LoanStatus.COMPLETED) {
      throw new BadRequestException('Completed loans are read-only.');
    }
    if (loan.status === LoanStatus.CANCELLED || loan.deletedAt) {
      throw new BadRequestException(
        'Cancelled or deleted loans cannot be changed.',
      );
    }
  }

  private assertLoanCanReceiveRepayments(loan: FamilyLoan) {
    if (loan.status === LoanStatus.COMPLETED) {
      throw new BadRequestException('Completed loans are read-only.');
    }
    if (loan.status === LoanStatus.CANCELLED || loan.deletedAt) {
      throw new BadRequestException(
        'Cancelled or deleted loans cannot be repaid.',
      );
    }
    if (loan.approvalStatus !== LoanApprovalStatus.APPROVED) {
      throw new BadRequestException('Loan must be approved before repayments.');
    }
  }

  private async findLoanRecord(familyId: string, id: string) {
    const loan = await this.prisma.familyLoan.findFirst({
      where: { familyId, id, deletedAt: null },
      include: this.loanInclude(),
    });
    if (!loan) throw new NotFoundException('Loan not found.');
    return loan;
  }

  private async findRepaymentRecord(
    familyId: string,
    loanId: string,
    repaymentId: string,
  ) {
    const repayment = await this.prisma.familyLoanRepayment.findFirst({
      where: { familyId, loanId, id: repaymentId, deletedAt: null },
      include: this.repaymentInclude(),
    });
    if (!repayment) throw new NotFoundException('Repayment not found.');
    return repayment;
  }

  private async assertMembersBelong(
    familyId: string,
    memberIds: Array<string | null | undefined>,
  ) {
    const ids = [...new Set(memberIds.filter(Boolean) as string[])];
    if (!ids.length) return;
    const count = await this.prisma.familyMember.count({
      where: { familyId, removedAt: null, id: { in: ids } },
    });
    if (count !== ids.length) {
      throw new BadRequestException(
        'One or more members do not belong to this family.',
      );
    }
  }

  private async assertLoanCategory(
    familyId: string,
    categoryId: string | null | undefined,
    loanType: LoanType,
  ) {
    if (!categoryId) return;
    const expectedType =
      loanType === LoanType.BORROWED
        ? TransactionType.INCOME
        : TransactionType.EXPENSE;
    const category = await this.prisma.familyTransactionCategory.findFirst({
      where: {
        id: categoryId,
        familyId,
        scope: TransactionScope.FAMILY,
        ownerId: null,
        status: CategoryStatus.ACTIVE,
      },
    });
    if (!category) throw new BadRequestException('Loan category not found.');
    if (category.type !== expectedType) {
      throw new BadRequestException(
        'Borrowed loans require an income category and lent loans require an expense category.',
      );
    }
  }

  private async getLoanContacts(
    familyId: string,
    input: {
      borrowerContactId?: string | null;
      lenderContactId?: string | null;
    },
  ) {
    const ids = [
      input.borrowerContactId || null,
      input.lenderContactId || null,
    ].filter(Boolean) as string[];
    if (!ids.length) {
      return {
        borrowerContact: null,
        lenderContact: null,
      };
    }

    const contacts = await this.prisma.familyContact.findMany({
      where: { familyId, id: { in: [...new Set(ids)] }, deletedAt: null },
    });
    if (contacts.length !== new Set(ids).size) {
      throw new BadRequestException(
        'One or more loan contacts do not belong to this family.',
      );
    }

    const byId = new Map(contacts.map((contact) => [contact.id, contact]));
    return {
      borrowerContact: input.borrowerContactId
        ? (byId.get(input.borrowerContactId) ?? null)
        : null,
      lenderContact: input.lenderContactId
        ? (byId.get(input.lenderContactId) ?? null)
        : null,
    };
  }

  private assertRequiredCounterparty(
    loanType: LoanType,
    input: {
      borrowerName?: string | null;
      borrowerContact?: FamilyContact | null;
      lenderName?: string | null;
      lenderContact?: FamilyContact | null;
    },
  ) {
    if (
      loanType === LoanType.BORROWED &&
      !input.lenderContact &&
      !input.lenderName?.trim()
    ) {
      throw new BadRequestException(
        'Borrowed loans require a lender contact or lender name.',
      );
    }

    if (
      loanType === LoanType.LENT &&
      !input.borrowerContact &&
      !input.borrowerName?.trim()
    ) {
      throw new BadRequestException(
        'Lent loans require a borrower contact or borrower name.',
      );
    }
  }

  private async assertReceiptBelongs(
    familyId: string,
    receiptId: string | null | undefined,
  ) {
    if (!receiptId) return;
    const receipt = await this.prisma.familyReceipt.findFirst({
      where: { id: receiptId, familyId },
    });
    if (!receipt) throw new BadRequestException('Receipt not found.');
  }

  private async refreshOverdueLoans(familyId: string) {
    await this.prisma.familyLoan.updateMany({
      where: {
        familyId,
        deletedAt: null,
        approvalStatus: LoanApprovalStatus.APPROVED,
        status: LoanStatus.ACTIVE,
        dueDate: { lt: new Date() },
        remainingBalanceMinorUnits: { gt: 0 },
      },
      data: { status: LoanStatus.OVERDUE },
    });
  }

  private calculateTotalExpectedAmount(
    principal: bigint,
    interestType: LoanInterestType,
    interestRate: string,
  ) {
    if (principal <= 0n) {
      throw new BadRequestException(
        'Principal amount must be greater than zero.',
      );
    }
    if (interestType === LoanInterestType.NONE) return principal;
    if (interestType === LoanInterestType.FIXED) {
      if (!/^[0-9]+$/.test(interestRate)) {
        throw new BadRequestException(
          'Fixed interest must be an integer minor-unit amount.',
        );
      }
      return principal + BigInt(interestRate);
    }

    const scaledRate = this.decimalToScaledInteger(interestRate);
    const denominator = 100n * 10000n;
    const interest = (principal * scaledRate + denominator / 2n) / denominator;
    return principal + interest;
  }

  private decimalToScaledInteger(value: string) {
    const [whole, fractional = ''] = value.split('.');
    const padded = `${fractional}0000`.slice(0, 4);
    return BigInt(whole) * 10000n + BigInt(padded);
  }

  private resolveLoanStatus(input: {
    approvalStatus: LoanApprovalStatus;
    dueDate: Date;
    remainingBalanceMinorUnits: bigint;
    currentStatus: LoanStatus;
  }) {
    if (input.currentStatus === LoanStatus.CANCELLED)
      return LoanStatus.CANCELLED;
    if (input.remainingBalanceMinorUnits === 0n) return LoanStatus.COMPLETED;
    if (input.approvalStatus !== LoanApprovalStatus.APPROVED)
      return LoanStatus.DRAFT;
    return input.dueDate < new Date() ? LoanStatus.OVERDUE : LoanStatus.ACTIVE;
  }

  private toDate(value: string, field: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid date.`);
    }
    return date;
  }

  private loanInclude() {
    return LOAN_INCLUDE;
  }

  private repaymentInclude() {
    return REPAYMENT_INCLUDE;
  }

  private serializeLoan(loan: LoanWithRelations) {
    return {
      id: loan.id,
      familyId: loan.familyId,
      title: loan.title,
      description: loan.description,
      loanType: loan.loanType,
      principalAmountMinorUnits: loan.principalAmountMinorUnits.toString(),
      interestRate: loan.interestRate.toString(),
      interestType: loan.interestType,
      totalExpectedAmountMinorUnits:
        loan.totalExpectedAmountMinorUnits.toString(),
      paidAmountMinorUnits: loan.paidAmountMinorUnits.toString(),
      remainingBalanceMinorUnits: loan.remainingBalanceMinorUnits.toString(),
      balances: {
        principalAmountMinorUnits: loan.principalAmountMinorUnits.toString(),
        totalExpectedAmountMinorUnits:
          loan.totalExpectedAmountMinorUnits.toString(),
        paidAmountMinorUnits: loan.paidAmountMinorUnits.toString(),
        remainingBalanceMinorUnits: loan.remainingBalanceMinorUnits.toString(),
      },
      currency: loan.currency,
      borrowerName: loan.borrowerName,
      borrowerMemberId: loan.borrowerMemberId,
      borrowerContactId: loan.borrowerContactId,
      borrower: loan.borrowerMember
        ? {
            memberId: loan.borrowerMemberId,
            name: loan.borrowerMember.user.fullName,
          }
        : loan.borrowerContact
          ? {
              contactId: loan.borrowerContactId,
              name: loan.borrowerName ?? loan.borrowerContact.fullName,
              phoneNumber: loan.borrowerContact.phoneNumber,
              relationshipToFamily: loan.borrowerContact.relationshipToFamily,
              organization: loan.borrowerContact.organization,
            }
          : loan.borrowerName
            ? { memberId: null, contactId: null, name: loan.borrowerName }
            : null,
      lenderName: loan.lenderName,
      lenderMemberId: loan.lenderMemberId,
      lenderContactId: loan.lenderContactId,
      lender: loan.lenderMember
        ? {
            memberId: loan.lenderMemberId,
            name: loan.lenderMember.user.fullName,
          }
        : loan.lenderContact
          ? {
              contactId: loan.lenderContactId,
              name: loan.lenderName ?? loan.lenderContact.fullName,
              phoneNumber: loan.lenderContact.phoneNumber,
              relationshipToFamily: loan.lenderContact.relationshipToFamily,
              organization: loan.lenderContact.organization,
            }
          : loan.lenderName
            ? { memberId: null, contactId: null, name: loan.lenderName }
            : null,
      category: loan.category,
      categoryId: loan.categoryId,
      startDate: loan.startDate.toISOString(),
      dueDate: loan.dueDate.toISOString(),
      repaymentFrequency: loan.repaymentFrequency,
      status: loan.status,
      approvalStatus: loan.approvalStatus,
      approvedById: loan.approvedById,
      approvedByName: loan.approvedBy?.fullName ?? null,
      approvedAt: loan.approvedAt?.toISOString() ?? null,
      createdById: loan.createdById,
      createdByName: loan.createdBy?.fullName ?? null,
      updatedById: loan.updatedById,
      updatedByName: loan.updatedBy?.fullName ?? null,
      repaymentCount: loan._count?.repayments ?? 0,
      documentsCount: loan._count?.documents ?? 0,
      auditCount: loan._count?.auditLogs ?? 0,
      audit: loan.auditLogs.map((audit) => ({
        id: audit.id,
        action: audit.action,
        description: audit.description,
        performedById: audit.performedById,
        performedByName: audit.performedBy?.fullName ?? null,
        createdAt: audit.createdAt.toISOString(),
      })),
      latestAudit: loan.auditLogs?.[0]
        ? {
            action: loan.auditLogs[0].action,
            description: loan.auditLogs[0].description,
            createdAt: loan.auditLogs[0].createdAt.toISOString(),
          }
        : null,
      isOverdue:
        loan.status === LoanStatus.OVERDUE ||
        (loan.dueDate < new Date() && loan.remainingBalanceMinorUnits > 0n),
      deletedAt: loan.deletedAt?.toISOString() ?? null,
      createdAt: loan.createdAt.toISOString(),
      updatedAt: loan.updatedAt.toISOString(),
    };
  }

  private serializeRepayment(repayment: RepaymentWithRelations) {
    return {
      id: repayment.id,
      loanId: repayment.loanId,
      familyId: repayment.familyId,
      amountMinorUnits: repayment.amountMinorUnits.toString(),
      paymentDate: repayment.paymentDate.toISOString(),
      paymentMethod: repayment.paymentMethod,
      paidByMemberId: repayment.paidByMemberId,
      paidByName: repayment.paidByMember?.user.fullName ?? null,
      receivedByMemberId: repayment.receivedByMemberId,
      receivedByName: repayment.receivedByMember?.user.fullName ?? null,
      receiptId: repayment.receiptId,
      receipt: repayment.receipt,
      notes: repayment.notes,
      createdById: repayment.createdById,
      createdByName: repayment.createdBy?.fullName ?? null,
      deletedAt: repayment.deletedAt?.toISOString() ?? null,
      createdAt: repayment.createdAt.toISOString(),
      updatedAt: repayment.updatedAt.toISOString(),
    };
  }

  private serializeDocument(document: DocumentWithUploader) {
    return {
      id: document.id,
      loanId: document.loanId,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      fileType: document.fileType,
      fileSizeBytes: document.fileSizeBytes,
      uploadedById: document.uploadedById,
      uploadedByName: document.uploadedBy?.fullName ?? null,
      deletedAt: document.deletedAt?.toISOString() ?? null,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }

  private loanSnapshot(loan: FamilyLoan): Prisma.InputJsonObject {
    return {
      id: loan.id,
      title: loan.title,
      loanType: loan.loanType,
      principalAmountMinorUnits: loan.principalAmountMinorUnits.toString(),
      totalExpectedAmountMinorUnits:
        loan.totalExpectedAmountMinorUnits.toString(),
      paidAmountMinorUnits: loan.paidAmountMinorUnits.toString(),
      remainingBalanceMinorUnits: loan.remainingBalanceMinorUnits.toString(),
      status: loan.status,
      approvalStatus: loan.approvalStatus,
      borrowerContactId: loan.borrowerContactId,
      lenderContactId: loan.lenderContactId,
      dueDate: loan.dueDate.toISOString(),
    };
  }

  private repaymentSnapshot(
    repayment: FamilyLoanRepayment,
  ): Prisma.InputJsonObject {
    return {
      id: repayment.id,
      amountMinorUnits: repayment.amountMinorUnits.toString(),
      paymentDate: repayment.paymentDate.toISOString(),
      paymentMethod: repayment.paymentMethod,
      deletedAt: repayment.deletedAt?.toISOString() ?? null,
    };
  }
}
