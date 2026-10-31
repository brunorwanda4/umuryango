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

@ApiTags('family-notifications')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@Controller('api/v1/families/:familySlug/notifications')
@UseGuards(JwtAuthGuard)
export class FamilyNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List notifications for a specific family workspace',
  })
  @ApiOkResponse({
    description: 'Paginated family notifications returned successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Family does not exist or user is not an active member.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async list(
    @CurrentUserId() userId: string,
    @Param('familySlug') familySlug: string,
    @Query() query: ListNotificationsDto,
  ) {
    const data = await this.notificationsService.listForFamily(
      userId,
      familySlug,
      query,
    );
    return {
      data,
      message: 'Family notifications retrieved successfully.',
    };
  }

  @Get('summary')
  @ApiOperation({
    summary:
      'Get authoritative notification unread count and recent items for a specific family',
  })
  @ApiOkResponse({
    description: 'Family notification summary returned successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Family does not exist or user is not an active member.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async getSummary(
    @CurrentUserId() userId: string,
    @Param('familySlug') familySlug: string,
  ) {
    const data = await this.notificationsService.getFamilySummary(
      userId,
      familySlug,
    );
    return {
      data,
      message: 'Family notification summary retrieved successfully.',
    };
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all unread notifications in this family workspace as read',
  })
  @ApiOkResponse({
    description: 'All notifications for this family marked as read.',
  })
  @ApiNotFoundResponse({
    description: 'Family does not exist or user is not an active member.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async markAllRead(
    @CurrentUserId() userId: string,
    @Param('familySlug') familySlug: string,
  ) {
    const data = await this.notificationsService.markAllAsReadForFamily(
      userId,
      familySlug,
    );
    return {
      data,
      message: 'Family notifications marked as read.',
    };
  }

  @Patch(':notificationId/read')
  @ApiOperation({
    summary: 'Mark an individual notification within this family as read',
  })
  @ApiOkResponse({
    description: 'Notification marked as read.',
  })
  @ApiNotFoundResponse({
    description:
      'Family or notification not found, or notification does not belong to this family.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async markRead(
    @CurrentUserId() userId: string,
    @Param('familySlug') familySlug: string,
    @Param('notificationId') notificationId: string,
  ) {
    const data = await this.notificationsService.markAsReadForFamily(
      userId,
      familySlug,
      notificationId,
    );
    return {
      data,
      message: 'Notification marked as read.',
    };
  }
}
