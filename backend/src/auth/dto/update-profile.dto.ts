import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  @IsOptional()
  fullName?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  @IsOptional()
  email?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.trim() || null;
  })
  @IsString()
  @Matches(/^\+?[0-9][0-9\s()-]{6,19}$/)
  @IsOptional()
  phoneNumber?: string | null;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.trim() || null;
  })
  @IsIn(['female', 'male', 'custom'])
  @IsOptional()
  gender?: string | null;
}
