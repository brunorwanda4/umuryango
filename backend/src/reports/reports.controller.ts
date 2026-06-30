import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
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
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@Controller('api/v1/families/:familyId/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'Aggregate family reports overview from persisted records (contributions, projects, source records)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['month', 'quarter', 'year'],
    description: 'Reporting window. Defaults to the current month.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: [
      'all',
      'money',
      'contributions',
      'projects',
      'savings',
      'debts',
      'budgets',
    ],
    description: 'Report type filter. Defaults to all.',
  })
  @ApiOkResponse({
    description: 'Reports overview generated from persisted records.',
    schema: {
      example: {
        data: {
          currency: 'RWF',
          generatedAt: '2026-06-30T08:00:00.000Z',
          sourceRecordCount: 12,
          period: {
            label: 'This month',
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T08:00:00.000Z',
          },
          totals: {
            cashBalanceMinorUnits: null,
            incomeMinorUnits: null,
            expenseMinorUnits: null,
            savingsMinorUnits: null,
            debtOutstandingMinorUnits: null,
            contributionsPaidMinorUnits: '500000',
            projectPlannedMinorUnits: '2000000',
            activeProjectCount: 3,
            reportCount: null,
            exportCount: null,
            pendingApprovalCount: 2,
          },
          trend: [],
          breakdown: [
            { label: 'Contributions', amountMinorUnits: '500000' },
            { label: 'Projects (planned)', amountMinorUnits: '2000000' },
          ],
          reports: [],
          sourceRecords: [],
          exports: [],
        },
        message: 'Reports overview retrieved successfully.',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'The user does not have VIEW_REPORTS capability.',
  })
  @ApiNotFoundResponse({
    description: 'Family does not exist or the user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async getOverview(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Query('period') period?: string,
    @Query('type') type?: string,
  ) {
    const data = await this.reportsService.getOverview(
      userId,
      familyId,
      period,
      type,
    );

    return { data, message: 'Reports overview retrieved successfully.' };
  }
}
