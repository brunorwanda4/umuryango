import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContributionCadence } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

const MINOR_UNITS_PATTERN = /^[1-9]\d{0,14}$/;

export class PlanAssignmentDto {
  @ApiProperty({ example: 'clx0000000000000000000001' })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiPropertyOptional({
    description:
      'Per-cycle commitment in integer minor units. Defaults to the plan amount when omitted.',
    example: '50000',
  })
  @IsOptional()
  @Matches(MINOR_UNITS_PATTERN, {
    message: 'amountMinorUnits must be a positive integer in minor units.',
  })
  amountMinorUnits?: string;
}

export class CreatePlanDto {
  @ApiProperty({ example: 'Monthly family fund', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiProperty({
    enum: ContributionCadence,
    example: ContributionCadence.MONTHLY,
  })
  @IsEnum(ContributionCadence)
  cadence: ContributionCadence;

  @ApiProperty({
    description: 'Default per-cycle commitment in integer minor units.',
    example: '50000',
  })
  @Matches(MINOR_UNITS_PATTERN, {
    message: 'amountMinorUnits must be a positive integer in minor units.',
  })
  amountMinorUnits: string;

  @ApiPropertyOptional({ example: 'RWF', maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ type: [PlanAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PlanAssignmentDto)
  assignments?: PlanAssignmentDto[];
}
