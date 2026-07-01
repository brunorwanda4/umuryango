import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBudgetDto {
  @ApiPropertyOptional({
    description: 'Category ID, if the budget is for a specific category',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ description: 'The budget amount in minor units' })
  @IsNumber()
  @IsNotEmpty()
  amountMinorUnits: number;

  @ApiProperty({ description: 'The currency code (e.g. RWF, USD)' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'The start date of the budget period' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'The end date of the budget period' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
