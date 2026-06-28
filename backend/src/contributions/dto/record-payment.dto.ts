import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContributionPaymentMethod } from '@prisma/client';
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

const MINOR_UNITS_PATTERN = /^[1-9]\d{0,14}$/;

export class RecordPaymentDto {
  @ApiProperty({ example: 'clx0000000000000000000010' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ example: 'clx0000000000000000000001' })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiPropertyOptional({ example: 'clx0000000000000000000020' })
  @IsOptional()
  @IsString()
  cycleId?: string;

  @ApiProperty({
    description: 'Contribution amount in integer minor units.',
    example: '50000',
  })
  @Matches(MINOR_UNITS_PATTERN, {
    message: 'amountMinorUnits must be a positive integer in minor units.',
  })
  amountMinorUnits: string;

  @ApiProperty({
    enum: ContributionPaymentMethod,
    example: ContributionPaymentMethod.MOBILE_MONEY,
  })
  @IsEnum(ContributionPaymentMethod)
  method: ContributionPaymentMethod;

  @ApiPropertyOptional({ example: '2026-06-28T07:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reference?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}
