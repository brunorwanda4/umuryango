import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ description: 'The category ID for the transaction' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'The amount in minor units (e.g. cents)' })
  @IsNumber()
  @IsNotEmpty()
  amountMinorUnits: number;

  @ApiProperty({ description: 'The currency code (e.g. RWF, USD)' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'The date the transaction occurred' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Payment method used' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Idempotency key to prevent duplicate records' })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
