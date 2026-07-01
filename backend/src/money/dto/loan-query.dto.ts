import { ApiPropertyOptional } from '@nestjs/swagger';
import { LoanApprovalStatus, LoanStatus, LoanType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { uppercase } from './create-loan.dto';

export class LoanQueryDto {
  @ApiPropertyOptional({ enum: LoanType })
  @IsOptional()
  @IsEnum(LoanType)
  @Transform(({ value }) => uppercase(value))
  loanType?: LoanType;

  @ApiPropertyOptional({ enum: LoanStatus })
  @IsOptional()
  @IsEnum(LoanStatus)
  @Transform(({ value }) => uppercase(value))
  status?: LoanStatus;

  @ApiPropertyOptional({ enum: LoanApprovalStatus })
  @IsOptional()
  @IsEnum(LoanApprovalStatus)
  @Transform(({ value }) => uppercase(value))
  approvalStatus?: LoanApprovalStatus;

  @ApiPropertyOptional({ example: 'school' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'clx0000000000000000000010' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsString()
  dueFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  dueTo?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    enum: ['createdAt', 'dueDate', 'title', 'remainingBalanceMinorUnits'],
  })
  @IsOptional()
  @IsIn(['createdAt', 'dueDate', 'title', 'remainingBalanceMinorUnits'])
  sortBy?: 'createdAt' | 'dueDate' | 'title' | 'remainingBalanceMinorUnits';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
