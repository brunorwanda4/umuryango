import { ApiPropertyOptional } from '@nestjs/swagger';
import { FamilyType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { FAMILY_CADENCES, FAMILY_CURRENCIES } from './create-family.dto';

export class UpdateFamilySettingsDto {
  @ApiPropertyOptional({ example: 'Mutesi Family', maxLength: 120 })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({ enum: FamilyType })
  @IsEnum(FamilyType)
  @IsOptional()
  type?: FamilyType;

  @ApiPropertyOptional({ enum: FAMILY_CURRENCIES })
  @IsIn(FAMILY_CURRENCIES as unknown as string[])
  @IsOptional()
  defaultCurrency?: string;

  @ApiPropertyOptional({ enum: FAMILY_CADENCES })
  @IsIn(FAMILY_CADENCES as unknown as string[])
  @IsOptional()
  contributionCadence?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
