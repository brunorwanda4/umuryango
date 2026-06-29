import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ACCESS_COOKIE_NAME } from '../auth/auth.constants';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MoneyService } from './money.service';

@ApiTags('money')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@Controller('api/v1/families/:familyId/money')
@UseGuards(JwtAuthGuard)
export class MoneyController {
  constructor(private readonly moneyService: MoneyService) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'Aggregate the family money overview from persisted records (totals, allocation, approvals, records)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['month', 'quarter', 'year'],
    description: 'Reporting window. Defaults to the current month.',
  })
  @ApiOkResponse({ description: 'Money overview generated from records.' })
  @ApiNotFoundResponse({
    description: 'Family does not exist or the user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async getOverview(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Query('period') period?: string,
  ) {
    const data = await this.moneyService.getOverview(userId, familyId, period);

    return { data, message: 'Money overview retrieved successfully.' };
  }
}
