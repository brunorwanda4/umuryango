import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanRepaymentMethod } from '@prisma/client';
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
import { MINOR_UNITS_PATTERN, trim, uppercase } from './create-loan.dto';

export class CreateRepaymentDto {
  @ApiProperty({
    description: 'Repayment amount in integer minor units.',
    example: '50000',
  })
  @Matches(MINOR_UNITS_PATTERN, {
    message: 'amountMinorUnits must be a positive integer.',
  })
  amountMinorUnits: string;

  @ApiProperty({ example: '2026-08-01T10:00:00.000Z' })
  @IsDateString()
  paymentDate: string;

  @ApiProperty({ enum: LoanRepaymentMethod, example: LoanRepaymentMethod.CASH })
  @IsEnum(LoanRepaymentMethod)
  @Transform(({ value }) => uppercase(value))
  paymentMethod: LoanRepaymentMethod;

  @ApiPropertyOptional({ example: 'clx0000000000000000000001' })
  @IsOptional()
  @IsString()
  paidByMemberId?: string | null;

  @ApiPropertyOptional({ example: 'clx0000000000000000000002' })
  @IsOptional()
  @IsString()
  receivedByMemberId?: string | null;

  @ApiPropertyOptional({ example: 'clx0000000000000000000015' })
  @IsOptional()
  @IsString()
  receiptId?: string | null;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => trim(value))
  notes?: string | null;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  idempotencyKey?: string | null;
}
