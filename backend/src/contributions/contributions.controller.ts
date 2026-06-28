import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
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
import { ContributionsService } from './contributions.service';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@ApiTags('contributions')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@Controller('api/v1/families/:familyId/contributions')
@UseGuards(JwtAuthGuard)
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'Aggregate family contribution totals, plans, cycles, and payments',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['month', 'quarter', 'year'],
    description: 'Reporting window. Defaults to the current month.',
  })
  @ApiOkResponse({
    description: 'Contribution overview generated from records.',
  })
  @ApiNotFoundResponse({
    description: 'Family does not exist or the user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async getOverview(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Query('period') period?: string,
  ) {
    const data = await this.contributionsService.getOverview(
      userId,
      familyId,
      period,
    );

    return { data, message: 'Contribution overview retrieved successfully.' };
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a recurring contribution plan' })
  @ApiCreatedResponse({ description: 'Contribution plan created.' })
  @ApiForbiddenResponse({
    description: 'The user cannot manage contributions.',
  })
  @ApiNotFoundResponse({
    description: 'Family does not exist or the user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async createPlan(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() dto: CreatePlanDto,
  ) {
    const data = await this.contributionsService.createPlan(
      userId,
      familyId,
      dto,
    );

    return { data, message: 'Contribution plan created successfully.' };
  }

  @Post('cycles')
  @ApiOperation({ summary: 'Open a contribution cycle for a plan' })
  @ApiCreatedResponse({ description: 'Contribution cycle opened.' })
  @ApiForbiddenResponse({
    description: 'The user cannot manage contributions.',
  })
  @ApiNotFoundResponse({
    description: 'Family or plan does not exist for this user.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async createCycle(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() dto: CreateCycleDto,
  ) {
    const data = await this.contributionsService.createCycle(
      userId,
      familyId,
      dto,
    );

    return { data, message: 'Contribution cycle opened successfully.' };
  }

  @Post('payments')
  @ApiOperation({ summary: 'Record a contribution payment for verification' })
  @ApiCreatedResponse({ description: 'Contribution payment recorded.' })
  @ApiForbiddenResponse({
    description: 'The user cannot manage contributions.',
  })
  @ApiNotFoundResponse({
    description: 'Family, plan, or cycle does not exist for this user.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async recordPayment(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() dto: RecordPaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const data = await this.contributionsService.recordPayment(
      userId,
      familyId,
      dto,
      idempotencyKey,
    );

    return { data, message: 'Contribution payment recorded successfully.' };
  }

  @Patch('payments/:paymentId/verify')
  @ApiOperation({ summary: 'Verify a recorded contribution payment' })
  @ApiOkResponse({ description: 'Contribution payment verified.' })
  @ApiForbiddenResponse({
    description: 'The user cannot manage contributions.',
  })
  @ApiNotFoundResponse({
    description: 'Family or payment does not exist for this user.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async verifyPayment(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('paymentId') paymentId: string,
  ) {
    const data = await this.contributionsService.verifyPayment(
      userId,
      familyId,
      paymentId,
    );

    return { data, message: 'Contribution payment verified successfully.' };
  }
}
