import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, familyId: string, dto: CreateReceiptDto) {
    // Verify the transaction exists and belongs to the family
    const transaction = await this.prisma.familyTransaction.findFirst({
      where: { id: dto.transactionId, familyId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.prisma.familyReceipt.create({
      data: {
        familyId,
        uploadedById: userId,
        transactionId: dto.transactionId,
        fileName: dto.fileName,
        fileType: dto.fileType,
        fileSizeBytes: dto.fileSizeBytes,
        storageKey: dto.storageKey,
      },
    });
  }

  async findAllByTransaction(familyId: string, transactionId: string) {
    return this.prisma.familyReceipt.findMany({
      where: { familyId, transactionId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { fullName: true } },
      },
    });
  }

  async remove(familyId: string, id: string) {
    const receipt = await this.prisma.familyReceipt.findFirst({
      where: { familyId, id },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    // Ideally, also delete from Bunny Storage here, or queue a job for it.
    return this.prisma.familyReceipt.delete({
      where: { id },
    });
  }
}
