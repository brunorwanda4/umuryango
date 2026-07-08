import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncomeRecurrence, TransactionType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const TRANSACTION_MINOR_UNITS_PATTERN = /^(0|[1-9]\d{0,14})$/;

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function uppercase(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

function minorUnits(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value).toString();
  }

  return trim(value);
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'The category ID for the transaction' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => trim(value))
  categoryId: string;

  @ApiProperty({
    description: 'Amount paid in integer minor units.',
    example: '250000',
  })
  @Matches(TRANSACTION_MINOR_UNITS_PATTERN, {
    message: 'amountMinorUnits must be a non-negative integer.',
  })
  @Transform(({ value }) => minorUnits(value))
  amountMinorUnits: string;

  @ApiProperty({ description: 'The currency code (e.g. RWF, USD)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  @Transform(({ value }) => uppercase(value))
  currency: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  @Transform(({ value }) => uppercase(value))
  type: TransactionType;

  @ApiProperty({ description: 'The date the transaction occurred' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsString()
  @IsOptional()
  @MaxLength(180)
  @Transform(({ value }) => trim(value))
  description?: string;

  @ApiPropertyOptional({ description: 'Payment method used' })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  @Transform(({ value }) => uppercase(value))
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Idempotency key to prevent duplicate records',
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @Transform(({ value }) => trim(value))
  notes?: string;

  @ApiPropertyOptional({
    description: 'Person/organization who sent the money',
  })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  @Transform(({ value }) => trim(value))
  receivedFrom?: string;

  @ApiPropertyOptional({
    description: 'Family contact ID for the person or organization who paid.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  receivedFromContactId?: string;

  @ApiPropertyOptional({ description: 'Member who received the money' })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  @Transform(({ value }) => trim(value))
  receivedBy?: string;

  @ApiPropertyOptional({
    enum: IncomeRecurrence,
    description: 'Use MONTHLY for rent or other income expected every month.',
  })
  @IsOptional()
  @IsEnum(IncomeRecurrence)
  @Transform(({ value }) => uppercase(value))
  incomeRecurrence?: IncomeRecurrence;

  @ApiPropertyOptional({
    description: 'Expected amount for this rent/monthly income period.',
    example: '300000',
  })
  @IsOptional()
  @Matches(TRANSACTION_MINOR_UNITS_PATTERN, {
    message: 'expectedAmountMinorUnits must be a non-negative integer.',
  })
  @Transform(({ value }) => minorUnits(value))
  expectedAmountMinorUnits?: string;

  @ApiPropertyOptional({ description: 'Date the rent/monthly income is due.' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Start of the month/period being paid.' })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({ description: 'End of the month/period being paid.' })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiPropertyOptional({
    description: 'House, room, or property name for rental income.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(({ value }) => trim(value))
  propertyName?: string;
}
