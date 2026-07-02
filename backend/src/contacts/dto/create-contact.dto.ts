import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FamilyContactStatus, FamilyContactType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export function uppercase(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

export function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return Boolean(value);
}

export class CreateContactDto {
  @ApiProperty({ example: 'Dr. Aline Uwase', maxLength: 140 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(140)
  @Transform(({ value }) => trim(value))
  fullName: string;

  @ApiProperty({ enum: FamilyContactType, example: FamilyContactType.DOCTOR })
  @IsEnum(FamilyContactType)
  @Transform(({ value }) => uppercase(value))
  contactType: FamilyContactType;

  @ApiPropertyOptional({ example: '+250788000000', maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => trim(value))
  phoneNumber?: string | null;

  @ApiPropertyOptional({ example: 'aline@example.com', maxLength: 180 })
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  @Transform(({ value }) => trim(value))
  email?: string | null;

  @ApiPropertyOptional({ maxLength: 260 })
  @IsOptional()
  @IsString()
  @MaxLength(260)
  @Transform(({ value }) => trim(value))
  address?: string | null;

  @ApiPropertyOptional({ example: 'Family doctor', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  relationshipToFamily?: string | null;

  @ApiPropertyOptional({ example: 'Kigali Medical Clinic', maxLength: 140 })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  @Transform(({ value }) => trim(value))
  organization?: string | null;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => trim(value))
  notes?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBoolean(value))
  isEmergencyContact?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBoolean(value))
  isLoanContact?: boolean;

  @ApiPropertyOptional({
    enum: FamilyContactStatus,
    default: FamilyContactStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(FamilyContactStatus)
  @Transform(({ value }) => uppercase(value))
  status?: FamilyContactStatus;
}
