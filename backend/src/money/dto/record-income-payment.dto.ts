import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

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

export class RecordIncomePaymentDto {
  @ApiProperty({
    description: 'Actual amount paid now in integer minor units.',
    example: '150000',
  })
  @IsNotEmpty()
  @Matches(/^[1-9]\d{0,14}$/, {
    message: 'amountMinorUnits must be a positive integer.',
  })
  @Transform(({ value }) => minorUnits(value))
  amountMinorUnits: string;

  @ApiProperty({ description: 'Date the payment was received.' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Payment method used.' })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  @Transform(({ value }) => uppercase(value))
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Member who received the money.' })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  @Transform(({ value }) => trim(value))
  receivedBy?: string;

  @ApiPropertyOptional({
    description: 'Family contact ID for the person or organization who paid.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  receivedFromContactId?: string;

  @ApiPropertyOptional({ description: 'Optional payment notes.' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @Transform(({ value }) => trim(value))
  notes?: string;

  @ApiPropertyOptional({
    description: 'Idempotency key to prevent duplicate payment records.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  idempotencyKey?: string;
}
