import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { SyncPullQueryDto, SyncPushDto } from './dto/sync.dto';
import { SyncService } from './sync.service';

@ApiTags('sync')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/families/:familySlug/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  @ApiOperation({
    summary:
      'Pull incremental family-scoped records and tombstones since a server-issued cursor',
  })
  @ApiOkResponse({
    description: 'Incremental synchronization snapshot retrieved.',
  })
  @ApiForbiddenResponse({
    description: 'Family membership has been revoked.',
  })
  @ApiNotFoundResponse({
    description: 'Family does not exist or user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async pull(
    @CurrentUserId() userId: string,
    @Param('familySlug') familySlug: string,
    @Query() query: SyncPullQueryDto,
  ) {
    const data = await this.syncService.pull(userId, familySlug, query);
    return {
      data,
      message: 'Synchronization pull completed successfully.',
    };
  }

  @Post('push')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Push ordered offline outbox commands with idempotency keys and permission revalidation',
  })
  @ApiOkResponse({
    description: 'Per-command synchronization results returned.',
  })
  @ApiForbiddenResponse({
    description: 'Family membership has been revoked.',
  })
  @ApiNotFoundResponse({
    description: 'Family does not exist or user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async push(
    @CurrentUserId() userId: string,
    @Param('familySlug') familySlug: string,
    @Body() dto: SyncPushDto,
  ) {
    const data = await this.syncService.push(userId, familySlug, dto);
    return {
      data,
      message: 'Synchronization push processed.',
    };
  }
}
