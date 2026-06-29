import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FamilyProjectCategory,
  FamilyProjectContributionStrategy,
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

const MINOR_UNITS_PATTERN = /^[1-9]\d{0,14}$/;

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function uppercase(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

export class CreateProjectDto {
  @ApiProperty({ example: 'Build family house', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  name: string;

  @ApiProperty({
    enum: FamilyProjectCategory,
    example: FamilyProjectCategory.HOUSE,
  })
  @IsEnum(FamilyProjectCategory)
  @Transform(({ value }) => uppercase(value))
  category: FamilyProjectCategory;

  @ApiProperty({
    description: 'Target amount in integer minor units.',
    example: '5000000',
  })
  @Matches(MINOR_UNITS_PATTERN, {
    message:
      'targetAmountMinorUnits must be a positive integer in minor units.',
  })
  targetAmountMinorUnits: string;

  @ApiPropertyOptional({ example: 'RWF', maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }) => uppercase(value))
  currency?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  targetDate: string;

  @ApiPropertyOptional({ example: 'clx0000000000000000000001' })
  @IsOptional()
  @IsString()
  ownerMemberId?: string | null;

  @ApiProperty({
    enum: FamilyProjectContributionStrategy,
    example: FamilyProjectContributionStrategy.EQUAL_SHARES,
  })
  @IsEnum(FamilyProjectContributionStrategy)
  @Transform(({ value }) => uppercase(value))
  contributionStrategy: FamilyProjectContributionStrategy;

  @ApiPropertyOptional({
    description: 'Expected contribution per member in integer minor units.',
    example: '10000',
  })
  @IsOptional()
  @Matches(MINOR_UNITS_PATTERN, {
    message:
      'expectedContributionMinorUnits must be a positive integer in minor units.',
  })
  expectedContributionMinorUnits?: string | null;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => trim(value))
  participantNotes?: string | null;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => trim(value))
  description?: string | null;
}
