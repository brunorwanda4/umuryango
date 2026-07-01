import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateReceiptDto {
  @ApiProperty({ description: 'ID of the transaction this receipt belongs to' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty({ description: 'Size of the file in bytes' })
  @IsNumber()
  @IsNotEmpty()
  fileSizeBytes: number;

  @ApiProperty({
    description:
      'Storage key/path where the file is stored (e.g. Bunny Storage)',
  })
  @IsString()
  @IsNotEmpty()
  storageKey: string;
}
