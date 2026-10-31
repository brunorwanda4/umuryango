import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ACCESS_COOKIE_NAME } from '../auth/auth.constants';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List notifications for the current authenticated user',
  })
  @ApiOkResponse({
    description: 'Paginated list of notifications returned successfully.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async list(
    @CurrentUserId() userId: string,
    @Query() query: ListNotificationsDto,
  ) {
    const data = await this.notificationsService.listForUser(userId, query);
    return {
      data,
      message: 'Notifications retrieved successfully.',
    };
  }

  @Get('summary')
  @ApiOperation({
    summary:
      'Get authoritative notification unread count, pending invitations, and recent items',
  })
  @ApiOkResponse({
    description: 'Notification summary returned successfully.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async getSummary(@CurrentUserId() userId: string) {
    const data = await this.notificationsService.getSummary(userId);
    return {
      data,
      message: 'Notification summary retrieved successfully.',
    };
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all unread notifications belonging to the user as read',
  })
  @ApiOkResponse({
    description: 'All notifications marked as read.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async markAllRead(@CurrentUserId() userId: string) {
    const data = await this.notificationsService.markAllAsRead(userId);
    return {
      data,
      message: 'All notifications marked as read.',
    };
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark an individual notification as read',
  })
  @ApiOkResponse({
    description: 'Notification marked as read.',
  })
  @ApiNotFoundResponse({
    description: 'Notification not found or does not belong to the user.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async markRead(@CurrentUserId() userId: string, @Param('id') id: string) {
    const data = await this.notificationsService.markAsRead(userId, id);
    return {
      data,
      message: 'Notification marked as read.',
    };
  }
}
