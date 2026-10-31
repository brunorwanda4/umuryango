import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const SYNC_COMMAND_TYPES = [
  'CREATE_EXPENSE',
  'CREATE_INCOME',
  'CREATE_PERSONAL_TRANSACTION',
  'UPDATE_TRANSACTION_NOTES',
  'RECORD_CONTRIBUTION_PAYMENT',
  'CREATE_PROJECT',
  'CREATE_CONTACT',
  'UPDATE_CONTACT',
  'ATTACH_RECEIPT',
] as const;

export type SyncCommandType = (typeof SYNC_COMMAND_TYPES)[number];

export class SyncPullQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class SyncPushCommandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  idempotencyKey!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  localRecordId!: string;

  @IsString()
  @IsIn(SYNC_COMMAND_TYPES)
  commandType!: SyncCommandType;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  dependsOnLocalId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  baseVersion?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  clientCreatedAt!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

export class SyncPushDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  contractVersion!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  deviceId!: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SyncPushCommandDto)
  commands!: SyncPushCommandDto[];
}
