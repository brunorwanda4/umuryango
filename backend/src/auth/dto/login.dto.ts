import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email address or phone number used during registration.',
    example: 'claudine@example.com',
    minLength: 3,
    maxLength: 254,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  emailOrMobile: string;

  @ApiProperty({ minLength: 8, maxLength: 128, example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
