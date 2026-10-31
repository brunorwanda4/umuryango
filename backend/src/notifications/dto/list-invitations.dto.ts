import { ApiPropertyOptional } from '@nestjs/swagger';
import { FamilyInviteStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListInvitationsDto {
  @ApiPropertyOptional({
    enum: FamilyInviteStatus,
    default: FamilyInviteStatus.PENDING,
    description: 'Filter invitations by status (defaults to PENDING)',
  })
  @IsOptional()
  @IsEnum(FamilyInviteStatus)
  status?: FamilyInviteStatus = FamilyInviteStatus.PENDING;
}
