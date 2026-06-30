import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(familyId: string, createCategoryDto: CreateCategoryDto) {
    // Basic check if family exists
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
    });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return this.prisma.familyTransactionCategory.create({
      data: {
        familyId,
        name: createCategoryDto.name,
        type: createCategoryDto.type,
        description: createCategoryDto.description,
      },
    });
  }

  async findAll(familyId: string) {
    return this.prisma.familyTransactionCategory.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(familyId: string, id: string) {
    const category = await this.prisma.familyTransactionCategory.findFirst({
      where: { familyId, id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(familyId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(familyId, id); // Ensure it exists and belongs to the family

    return this.prisma.familyTransactionCategory.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(familyId: string, id: string) {
    await this.findOne(familyId, id); // Ensure it exists and belongs to the family

    // Check if category is being used by transactions or budgets before deleting?
    // Since we use restrict on transactions, Prisma will throw an error if we delete it while in use.
    // For budgets, we use cascade delete.
    return this.prisma.familyTransactionCategory.delete({
      where: { id },
    });
  }
}
