import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  ArrayMaxSize,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ImportContactItemDto {
  @ApiProperty({ maxLength: 140 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName: string;

  @ApiProperty({ required: false, maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phoneNumber?: string;

  @ApiProperty({ required: false, maxLength: 180 })
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @ApiProperty({ required: false, maxLength: 260 })
  @IsOptional()
  @IsString()
  @MaxLength(260)
  address?: string;

  @ApiProperty({ required: false, maxLength: 140 })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  organization?: string;

  @ApiProperty({ required: false, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ImportContactsDto {
  @ApiProperty({ type: [ImportContactItemDto], maxItems: 1000 })
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => ImportContactItemDto)
  contacts: ImportContactItemDto[];
}
