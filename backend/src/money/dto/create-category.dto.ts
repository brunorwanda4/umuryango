import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'The name of the category' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: TransactionType, description: 'Type of the category (INCOME or EXPENSE)' })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ description: 'An optional description for the category' })
  @IsString()
  @IsOptional()
  description?: string;
}
