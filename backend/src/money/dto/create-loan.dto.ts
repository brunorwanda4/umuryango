import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LoanInterestType,
  LoanRepaymentFrequency,
  LoanType,
} from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const MINOR_UNITS_PATTERN = /^[1-9]\d{0,14}$/;
export const DECIMAL_PATTERN = /^(0|[1-9]\d{0,8})(\.\d{1,4})?$/;

export function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export function uppercase(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

export class CreateLoanDto {
  @ApiProperty({ example: 'Education support loan', maxLength: 140 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(140)
  @Transform(({ value }) => trim(value))
  title: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => trim(value))
  description?: string | null;

  @ApiProperty({ enum: LoanType, example: LoanType.BORROWED })
  @IsEnum(LoanType)
  @Transform(({ value }) => uppercase(value))
  loanType: LoanType;

  @ApiProperty({
    description: 'Principal amount in integer minor units.',
    example: '250000',
  })
  @Matches(MINOR_UNITS_PATTERN, {
    message: 'principalAmountMinorUnits must be a positive integer.',
  })
  principalAmountMinorUnits: string;

  @ApiPropertyOptional({
    description:
      'Decimal interest value. For PERCENTAGE, 10.5 means 10.5%. For FIXED, this is a fixed minor-unit amount.',
    example: '10.5',
  })
  @IsOptional()
  @Matches(DECIMAL_PATTERN, {
    message:
      'interestRate must be a non-negative decimal with up to 4 decimals.',
  })
  interestRate?: string;

  @ApiProperty({ enum: LoanInterestType, example: LoanInterestType.PERCENTAGE })
  @IsEnum(LoanInterestType)
  @Transform(({ value }) => uppercase(value))
  interestType: LoanInterestType;

  @ApiPropertyOptional({ example: 'RWF', maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }) => uppercase(value))
  currency?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  borrowerName?: string | null;

  @ApiPropertyOptional({ example: 'clx0000000000000000000001' })
  @IsOptional()
  @IsString()
  borrowerMemberId?: string | null;

  @ApiPropertyOptional({ example: 'clx0000000000000000000100' })
  @IsOptional()
  @IsString()
  borrowerContactId?: string | null;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  lenderName?: string | null;

  @ApiPropertyOptional({ example: 'clx0000000000000000000002' })
  @IsOptional()
  @IsString()
  lenderMemberId?: string | null;

  @ApiPropertyOptional({ example: 'clx0000000000000000000101' })
  @IsOptional()
  @IsString()
  lenderContactId?: string | null;

  @ApiPropertyOptional({ example: 'clx0000000000000000000010' })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    enum: LoanRepaymentFrequency,
    example: LoanRepaymentFrequency.MONTHLY,
  })
  @IsEnum(LoanRepaymentFrequency)
  @Transform(({ value }) => uppercase(value))
  repaymentFrequency: LoanRepaymentFrequency;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  idempotencyKey?: string | null;
}
