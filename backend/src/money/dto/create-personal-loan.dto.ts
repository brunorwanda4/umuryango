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
import {
  DECIMAL_PATTERN,
  MINOR_UNITS_PATTERN,
  trim,
  uppercase,
} from './create-loan.dto';

export class CreatePersonalLoanDto {
  @ApiProperty({ example: 'School fees support', maxLength: 140 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(140)
  @Transform(({ value }) => trim(value))
  title: string;

  @ApiProperty({ enum: LoanType, example: LoanType.BORROWED })
  @IsEnum(LoanType)
  @Transform(({ value }) => uppercase(value))
  loanType: LoanType;

  @ApiProperty({ description: 'Saved trusted-person contact ID.' })
  @IsString()
  @IsNotEmpty()
  personContactId: string;

  @ApiProperty({ description: 'Amount in integer minor units.' })
  @Matches(MINOR_UNITS_PATTERN)
  principalAmountMinorUnits: string;

  @ApiPropertyOptional({ example: 'RWF', maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }) => uppercase(value))
  currency?: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => trim(value))
  notes?: string | null;

  @ApiPropertyOptional({ enum: LoanRepaymentFrequency })
  @IsOptional()
  @IsEnum(LoanRepaymentFrequency)
  @Transform(({ value }) => uppercase(value))
  repaymentFrequency?: LoanRepaymentFrequency;

  @ApiPropertyOptional({ enum: LoanInterestType })
  @IsOptional()
  @IsEnum(LoanInterestType)
  @Transform(({ value }) => uppercase(value))
  interestType?: LoanInterestType;

  @ApiPropertyOptional({ example: '5' })
  @IsOptional()
  @Matches(DECIMAL_PATTERN)
  interestRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  idempotencyKey?: string | null;
}
