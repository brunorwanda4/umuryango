import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PersonGoalProgressMethod,
  PersonPlanStatus,
  PersonPlanType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateMilestoneDto,
  CreatePersonalPlanDto,
  ReorderMilestonesDto,
  UpdateMilestoneDto,
  UpdatePersonalPlanDto,
} from './dto/personal-plan.dto';

const planInclude = {
  milestones: {
    where: { deletedAt: null },
    orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }],
  },
};

type PlanValidationInput = {
  dueDate?: string | Date | null;
  startDate?: string | Date | null;
  targetDate?: string | Date | null;
  needsMoney?: boolean;
  targetAmountMinorUnits?: string | bigint | null;
};

@Injectable()
export class PersonalPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(personId: string) {
    const [person, plans] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: personId },
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          avatarUrl: true,
        },
      }),
      this.prisma.personPlan.findMany({
        where: { personId, deletedAt: null },
        include: planInclude,
        orderBy: [
          { dueDate: 'asc' },
          { targetDate: 'asc' },
          { createdAt: 'desc' },
        ],
        take: 200,
      }),
    ]);

    if (!person) throw new NotFoundException('Person not found.');

    return {
      person: { ...person, relationship: 'Personal profile' },
      plans: plans.map((plan) => this.serialize(plan)),
    };
  }

  async create(personId: string, dto: CreatePersonalPlanDto) {
    this.validate(dto.type, dto);
    const status = dto.status ?? PersonPlanStatus.PENDING;
    const plan = await this.prisma.personPlan.create({
      data: {
        personId,
        createdById: personId,
        type: dto.type,
        title: dto.title,
        description: dto.description || null,
        status,
        priority:
          dto.type === PersonPlanType.TASK ? (dto.priority ?? null) : null,
        startDate: this.date(dto.startDate),
        dueDate:
          dto.type === PersonPlanType.TASK ? this.date(dto.dueDate) : null,
        dueTime: dto.type === PersonPlanType.TASK ? dto.dueTime || null : null,
        targetDate:
          dto.type === PersonPlanType.LONG_TERM_GOAL
            ? this.date(dto.targetDate)
            : null,
        reminderAt: this.date(dto.reminderAt),
        reminderFrequency: dto.reminderFrequency || null,
        note: dto.note || null,
        goalCategory: dto.goalCategory || null,
        goalIcon: dto.goalIcon || null,
        needsMoney:
          dto.type === PersonPlanType.LONG_TERM_GOAL && Boolean(dto.needsMoney),
        targetAmountMinorUnits: this.money(dto.targetAmountMinorUnits),
        currentAmountMinorUnits: this.money(dto.currentAmountMinorUnits),
        currency: dto.currency?.toUpperCase() ?? 'RWF',
        progressMethod:
          dto.progressMethod ?? PersonGoalProgressMethod.MILESTONE,
        completedAt: status === PersonPlanStatus.COMPLETED ? new Date() : null,
      },
      include: planInclude,
    });

    return this.serialize(plan);
  }

  async update(personId: string, planId: string, dto: UpdatePersonalPlanDto) {
    const existing = await this.requirePlan(personId, planId);
    if (dto.type && dto.type !== existing.type) {
      throw new BadRequestException('A plan type cannot be changed.');
    }
    this.validate(existing.type, { ...existing, ...dto });

    const status = dto.status ?? existing.status;
    const data: Record<string, unknown> = {};
    const assign = (key: string, value: unknown) => {
      if (value !== undefined) data[key] = value;
    };

    assign('title', dto.title);
    assign('description', dto.description === '' ? null : dto.description);
    assign('status', dto.status);
    assign('priority', dto.priority);
    assign('startDate', this.optionalDate(dto.startDate));
    assign('dueDate', this.optionalDate(dto.dueDate));
    assign('dueTime', dto.dueTime === '' ? null : dto.dueTime);
    assign('targetDate', this.optionalDate(dto.targetDate));
    assign('reminderAt', this.optionalDate(dto.reminderAt));
    assign(
      'reminderFrequency',
      dto.reminderFrequency === '' ? null : dto.reminderFrequency,
    );
    assign('note', dto.note === '' ? null : dto.note);
    assign('goalCategory', dto.goalCategory === '' ? null : dto.goalCategory);
    assign('goalIcon', dto.goalIcon === '' ? null : dto.goalIcon);
    assign('needsMoney', dto.needsMoney);
    assign(
      'targetAmountMinorUnits',
      this.optionalMoney(dto.targetAmountMinorUnits),
    );
    assign(
      'currentAmountMinorUnits',
      this.optionalMoney(dto.currentAmountMinorUnits),
    );
    assign('currency', dto.currency?.toUpperCase());
    assign('progressMethod', dto.progressMethod);

    if (dto.needsMoney === false) {
      data.targetAmountMinorUnits = null;
      data.currentAmountMinorUnits = null;
      data.progressMethod = PersonGoalProgressMethod.MILESTONE;
    }
    if (status === PersonPlanStatus.COMPLETED && !existing.completedAt) {
      data.completedAt = new Date();
    } else if (
      dto.status &&
      dto.status !== PersonPlanStatus.COMPLETED &&
      existing.completedAt
    ) {
      data.completedAt = null;
    }

    const updated = await this.prisma.personPlan.update({
      where: { id: existing.id },
      data,
      include: planInclude,
    });
    return this.serialize(updated);
  }

  async remove(personId: string, planId: string) {
    const plan = await this.requirePlan(personId, planId);
    await this.prisma.personPlan.update({
      where: { id: plan.id },
      data: { deletedAt: new Date() },
    });
    return { id: plan.id };
  }

  async addMilestone(
    personId: string,
    planId: string,
    dto: CreateMilestoneDto,
  ) {
    const plan = await this.requireGoal(personId, planId);
    const last = await this.prisma.personPlanMilestone.aggregate({
      where: { planId: plan.id, deletedAt: null },
      _max: { position: true },
    });
    return this.prisma.personPlanMilestone.create({
      data: {
        planId: plan.id,
        title: dto.title,
        position: (last._max.position ?? -1) + 1,
      },
    });
  }

  async updateMilestone(
    personId: string,
    planId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
  ) {
    await this.requireGoal(personId, planId);
    const milestone = await this.requireMilestone(planId, milestoneId);
    return this.prisma.personPlanMilestone.update({
      where: { id: milestone.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.completed !== undefined
          ? { completedAt: dto.completed ? new Date() : null }
          : {}),
      },
    });
  }

  async reorderMilestones(
    personId: string,
    planId: string,
    dto: ReorderMilestonesDto,
  ) {
    await this.requireGoal(personId, planId);
    const current = await this.prisma.personPlanMilestone.findMany({
      where: { planId, deletedAt: null },
      select: { id: true },
    });
    const currentIds = new Set(current.map((item) => item.id));
    if (
      dto.orderedIds.length !== currentIds.size ||
      new Set(dto.orderedIds).size !== currentIds.size ||
      dto.orderedIds.some((id) => !currentIds.has(id))
    ) {
      throw new BadRequestException(
        'orderedIds must contain every active milestone exactly once.',
      );
    }
    await this.prisma.$transaction(
      dto.orderedIds.map((id, position) =>
        this.prisma.personPlanMilestone.update({
          where: { id },
          data: { position },
        }),
      ),
    );
    return { orderedIds: dto.orderedIds };
  }

  async removeMilestone(personId: string, planId: string, milestoneId: string) {
    await this.requireGoal(personId, planId);
    const milestone = await this.requireMilestone(planId, milestoneId);
    await this.prisma.personPlanMilestone.update({
      where: { id: milestone.id },
      data: { deletedAt: new Date() },
    });
    return { id: milestone.id };
  }

  private async requirePlan(personId: string, planId: string) {
    const plan = await this.prisma.personPlan.findFirst({
      where: { id: planId, personId, deletedAt: null },
      include: planInclude,
    });
    if (!plan) throw new NotFoundException('Plan not found.');
    return plan;
  }

  private async requireGoal(personId: string, planId: string) {
    const plan = await this.requirePlan(personId, planId);
    if (plan.type !== PersonPlanType.LONG_TERM_GOAL) {
      throw new BadRequestException('Milestones belong to long-term goals.');
    }
    return plan;
  }

  private async requireMilestone(planId: string, milestoneId: string) {
    const milestone = await this.prisma.personPlanMilestone.findFirst({
      where: { id: milestoneId, planId, deletedAt: null },
    });
    if (!milestone) throw new NotFoundException('Milestone not found.');
    return milestone;
  }

  private validate(type: PersonPlanType, dto: PlanValidationInput) {
    if (type === PersonPlanType.TASK && !dto.dueDate) {
      throw new BadRequestException('A task requires a due date.');
    }
    if (type === PersonPlanType.LONG_TERM_GOAL && !dto.targetDate) {
      throw new BadRequestException('A long-term goal requires a target date.');
    }
    const start = this.date(dto.startDate);
    const target = this.date(dto.targetDate);
    if (start && target && target < start) {
      throw new BadRequestException('Target date must be after start date.');
    }
    if (dto.needsMoney) {
      const targetAmount = this.money(dto.targetAmountMinorUnits);
      if (!targetAmount || targetAmount <= 0n) {
        throw new BadRequestException(
          'A financial goal requires a positive target amount.',
        );
      }
    }
  }

  private serialize(plan: any) {
    const milestones = plan.milestones ?? [];
    const completedMilestones = milestones.filter(
      (item: any) => item.completedAt,
    ).length;
    const milestoneProgress = milestones.length
      ? Math.round((completedMilestones / milestones.length) * 100)
      : 0;
    const financialProgress =
      plan.needsMoney && plan.targetAmountMinorUnits > 0n
        ? Math.min(
            100,
            Math.round(
              (Number(plan.currentAmountMinorUnits ?? 0n) /
                Number(plan.targetAmountMinorUnits)) *
                100,
            ),
          )
        : 0;

    return {
      ...plan,
      targetAmountMinorUnits: plan.targetAmountMinorUnits?.toString() ?? null,
      currentAmountMinorUnits: plan.currentAmountMinorUnits?.toString() ?? null,
      progress:
        plan.progressMethod === PersonGoalProgressMethod.FINANCIAL
          ? financialProgress
          : milestoneProgress,
      milestones: milestones.map((item: any) => ({
        id: item.id,
        title: item.title,
        position: item.position,
        completedAt: item.completedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      startDate: plan.startDate?.toISOString() ?? null,
      dueDate: plan.dueDate?.toISOString() ?? null,
      targetDate: plan.targetDate?.toISOString() ?? null,
      reminderAt: plan.reminderAt?.toISOString() ?? null,
      completedAt: plan.completedAt?.toISOString() ?? null,
      deletedAt: undefined,
    };
  }

  private date(value?: string | Date | null) {
    return value ? new Date(value) : null;
  }

  private optionalDate(value?: string | null) {
    return value === undefined ? undefined : this.date(value);
  }

  private money(value?: string | bigint | null) {
    return value === undefined || value === null ? null : BigInt(value);
  }

  private optionalMoney(value?: string | null) {
    return value === undefined ? undefined : this.money(value);
  }
}
