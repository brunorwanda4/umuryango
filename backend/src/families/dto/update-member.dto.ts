import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  FamilyAuthority,
  FamilyCapability,
  FamilyKinship,
} from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMemberDto {
  @ApiPropertyOptional({ enum: FamilyAuthority })
  @IsEnum(FamilyAuthority)
  @IsOptional()
  authority?: FamilyAuthority;

  @ApiPropertyOptional({ enum: FamilyKinship })
  @IsEnum(FamilyKinship)
  @IsOptional()
  kinshipLabel?: FamilyKinship;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  kinshipCustom?: string;

  @ApiPropertyOptional({ enum: FamilyCapability, isArray: true })
  @IsArray()
  @ArrayUnique()
  @IsEnum(FamilyCapability, { each: true })
  @IsOptional()
  capabilities?: FamilyCapability[];
}
