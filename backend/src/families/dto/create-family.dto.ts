import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FamilyKinship, FamilyType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateFamilyInviteDto {
  @ApiProperty({ example: 'claudine@example.com' })
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiPropertyOptional({ enum: FamilyKinship })
  @IsEnum(FamilyKinship)
  @IsOptional()
  kinshipLabel?: FamilyKinship;
}

export const FAMILY_COUNTRIES = [
  'RW',
  'BI',
  'CD',
  'KE',
  'TZ',
  'UG',
  'OTHER',
] as const;

export const FAMILY_CURRENCIES = [
  'RWF',
  'USD',
  'EUR',
  'KES',
  'TZS',
  'UGX',
] as const;

export const FAMILY_CADENCES = [
  'monthly',
  'as-needed',
  'project-based',
  'event-based',
] as const;

export const FAMILY_TYPES = [
  FamilyType.NUCLEAR,
  FamilyType.JOINT_EXTENDED,
  FamilyType.SINGLE_PARENT,
  FamilyType.BLENDED,
  FamilyType.ADOPTIVE,
] as const;

export class CreateFamilyDto {
  @ApiProperty({ example: 'Mutesi Family', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({
    example: 'mutesi-family',
    description:
      'URL-safe slug. Generated from the name when omitted; uniqueness is enforced server-side.',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric words separated by hyphens.',
  })
  @MaxLength(140)
  // Frontend always sends a generated slug; treat empty as "let the server derive it".
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  slug?: string;

  @ApiProperty({ enum: FAMILY_COUNTRIES, example: 'RW' })
  @IsIn(FAMILY_COUNTRIES)
  country: string;

  @ApiProperty({ enum: FAMILY_CURRENCIES, example: 'RWF' })
  @IsIn(FAMILY_CURRENCIES)
  defaultCurrency: string;

  @ApiProperty({ enum: FAMILY_CADENCES, example: 'monthly' })
  @IsIn(FAMILY_CADENCES)
  contributionCadence: string;

  @ApiPropertyOptional({ enum: FAMILY_TYPES, example: FamilyType.NUCLEAR })
  @IsIn(FAMILY_TYPES)
  @IsOptional()
  type?: FamilyType;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    type: [CreateFamilyInviteDto],
    description:
      'Members to invite after the family is created, each with an optional kinship role.',
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateFamilyInviteDto)
  invites?: CreateFamilyInviteDto[];
}
