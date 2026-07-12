import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  PersonGoalProgressMethod,
  PersonPlanPriority,
  PersonPlanStatus,
  PersonPlanType,
} from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const MINOR_UNITS_PATTERN = /^\d{1,15}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const trim = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePersonalPlanDto {
  @ApiProperty({ enum: PersonPlanType })
  @IsEnum(PersonPlanType)
  type: PersonPlanType;

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  title: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => trim(value))
  description?: string | null;

  @ApiPropertyOptional({ enum: PersonPlanStatus })
  @IsOptional()
  @IsEnum(PersonPlanStatus)
  status?: PersonPlanStatus;

  @ApiPropertyOptional({ enum: PersonPlanPriority })
  @IsOptional()
  @IsEnum(PersonPlanPriority)
  priority?: PersonPlanPriority | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ example: '14:30' })
  @IsOptional()
  @Matches(TIME_PATTERN)
  dueTime?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  reminderAt?: string | null;

  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  reminderFrequency?: string | null;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => trim(value))
  note?: string | null;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  goalCategory?: string | null;

  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  goalIcon?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  needsMoney?: boolean;

  @ApiPropertyOptional({ description: 'Integer minor units.' })
  @IsOptional()
  @Matches(MINOR_UNITS_PATTERN)
  targetAmountMinorUnits?: string | null;

  @ApiPropertyOptional({ description: 'Integer minor units.' })
  @IsOptional()
  @Matches(MINOR_UNITS_PATTERN)
  currentAmountMinorUnits?: string | null;

  @ApiPropertyOptional({ default: 'RWF', maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ enum: PersonGoalProgressMethod })
  @IsOptional()
  @IsEnum(PersonGoalProgressMethod)
  progressMethod?: PersonGoalProgressMethod;
}

export class UpdatePersonalPlanDto extends PartialType(CreatePersonalPlanDto) {}

export class CreateMilestoneDto {
  @ApiProperty({ maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  @Transform(({ value }) => trim(value))
  title: string;
}

export class UpdateMilestoneDto extends PartialType(CreateMilestoneDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class ReorderMilestonesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  orderedIds: string[];
}
