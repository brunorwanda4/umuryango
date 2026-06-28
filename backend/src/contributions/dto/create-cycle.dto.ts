import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCycleDto {
  @ApiProperty({ example: 'clx0000000000000000000010' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ example: 'June 2026', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  label: string;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2026-06-30T23:59:59.000Z' })
  @IsDateString()
  periodEnd: string;

  @ApiProperty({ example: '2026-06-28T00:00:00.000Z' })
  @IsDateString()
  dueDate: string;
}
