import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class NativeRefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class NativeLogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
