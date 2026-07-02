import { ApiPropertyOptional } from '@nestjs/swagger';
import { FamilyContactStatus, FamilyContactType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { toBoolean, trim, uppercase } from './create-contact.dto';

export class ContactQueryDto {
  @ApiPropertyOptional({ example: 'doctor' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => trim(value))
  search?: string;

  @ApiPropertyOptional({ enum: FamilyContactType })
  @IsOptional()
  @IsEnum(FamilyContactType)
  @Transform(({ value }) => uppercase(value))
  contactType?: FamilyContactType;

  @ApiPropertyOptional({ enum: FamilyContactStatus })
  @IsOptional()
  @IsEnum(FamilyContactStatus)
  @Transform(({ value }) => uppercase(value))
  status?: FamilyContactStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBoolean(value))
  emergencyOnly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBoolean(value))
  loanOnly?: boolean;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
