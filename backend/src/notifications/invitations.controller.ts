import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ACCESS_COOKIE_NAME } from '../auth/auth.constants';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListInvitationsDto } from './dto/list-invitations.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('invitations')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@Controller('api/v1/invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List invitations addressed to the current user email',
  })
  @ApiOkResponse({
    description: 'Invitations list retrieved successfully.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async list(
    @CurrentUserId() userId: string,
    @Query() query: ListInvitationsDto,
  ) {
    const data = await this.invitationsService.listForUser(userId, query);
    return {
      data,
      message: 'Invitations retrieved successfully.',
    };
  }

  @Post(':id/accept')
  @ApiOperation({
    summary: 'Accept a pending family invitation',
  })
  @ApiOkResponse({
    description: 'Invitation accepted and family membership created.',
  })
  @ApiNotFoundResponse({ description: 'Invitation not found.' })
  @ApiForbiddenResponse({
    description: 'Invitation does not belong to the user.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async accept(@CurrentUserId() userId: string, @Param('id') id: string) {
    const data = await this.invitationsService.acceptInvitation(userId, id);
    return {
      data,
      message: 'Invitation accepted successfully.',
    };
  }

  @Post(':id/decline')
  @ApiOperation({
    summary: 'Decline a pending family invitation',
  })
  @ApiOkResponse({
    description: 'Invitation declined successfully.',
  })
  @ApiNotFoundResponse({ description: 'Invitation not found.' })
  @ApiForbiddenResponse({
    description: 'Invitation does not belong to the user.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async decline(@CurrentUserId() userId: string, @Param('id') id: string) {
    const data = await this.invitationsService.declineInvitation(userId, id);
    return {
      data,
      message: 'Invitation declined successfully.',
    };
  }
}
