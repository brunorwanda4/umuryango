import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryStatus, TransactionType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'The name of the category' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: TransactionType,
    description: 'Type of the category (INCOME or EXPENSE)',
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({
    description: 'An optional description for the category',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Lucide icon name for the category' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Color value (hex or CSS variable) for the category',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    enum: CategoryStatus,
    description: 'Status of the category',
  })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;
}
