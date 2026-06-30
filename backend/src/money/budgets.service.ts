import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, familyId: string, dto: CreateBudgetDto) {
    return this.prisma.familyBudget.create({
      data: {
        familyId,
        createdById: userId,
        categoryId: dto.categoryId,
        amountMinorUnits: BigInt(dto.amountMinorUnits),
        currency: dto.currency,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async findAll(familyId: string) {
    const budgets = await this.prisma.familyBudget.findMany({
      where: { familyId },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    return budgets.map((b) => ({
      ...b,
      amountMinorUnits: b.amountMinorUnits.toString(),
    }));
  }

  async findOne(familyId: string, id: string) {
    const budget = await this.prisma.familyBudget.findFirst({
      where: { familyId, id },
      include: { category: { select: { name: true } } },
    });

    if (!budget) throw new NotFoundException('Budget not found');

    return {
      ...budget,
      amountMinorUnits: budget.amountMinorUnits.toString(),
    };
  }

  async update(familyId: string, id: string, dto: UpdateBudgetDto) {
    await this.findOne(familyId, id); // check if exists

    const data: any = { ...dto };
    if (dto.amountMinorUnits !== undefined) {
      data.amountMinorUnits = BigInt(dto.amountMinorUnits);
    }
    if (dto.startDate !== undefined) {
      data.startDate = new Date(dto.startDate);
    }
    if (dto.endDate !== undefined) {
      data.endDate = new Date(dto.endDate);
    }

    const updated = await this.prisma.familyBudget.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      amountMinorUnits: updated.amountMinorUnits.toString(),
    };
  }

  async remove(familyId: string, id: string) {
    await this.findOne(familyId, id); // check if exists

    const deleted = await this.prisma.familyBudget.delete({
      where: { id },
    });

    return {
      ...deleted,
      amountMinorUnits: deleted.amountMinorUnits.toString(),
    };
  }
}
