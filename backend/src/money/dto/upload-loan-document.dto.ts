import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trim } from './create-loan.dto';

export class UploadLoanDocumentDto {
  @ApiProperty({ example: 'loan-agreement.pdf', maxLength: 180 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @Transform(({ value }) => trim(value))
  fileName: string;

  @ApiProperty({ example: 'https://storage.example.com/private/path' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  fileUrl: string;

  @ApiProperty({ example: 'application/pdf', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }) => trim(value))
  fileType: string;

  @ApiPropertyOptional({ example: 384000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(25 * 1024 * 1024)
  fileSizeBytes?: number;
}
