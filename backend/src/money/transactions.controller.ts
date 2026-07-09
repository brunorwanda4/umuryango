import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { ACCESS_COOKIE_NAME } from '../auth/auth.constants';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RecordIncomePaymentDto } from './dto/record-income-payment.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('money-transactions')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/families/:familyId/money/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction (Income/Expense)' })
  @ApiCreatedResponse({ description: 'Transaction recorded successfully.' })
  async create(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    const data = await this.transactionsService.create(userId, familyId, dto);
    // Convert BigInt for the response wrapper
    const serializedData = {
      ...data,
      amountMinorUnits: data.amountMinorUnits.toString(),
    };
    return {
      data: serializedData,
      message: 'Transaction recorded successfully.',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all transactions for a family' })
  @ApiQuery({ name: 'type', enum: TransactionType, required: false })
  @ApiQuery({ name: 'status', enum: TransactionStatus, required: false })
  @ApiOkResponse({ description: 'Transactions retrieved successfully.' })
  async findAll(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
  ) {
    const data = await this.transactionsService.findAll(userId, familyId, {
      type,
      status,
    });
    return { data, message: 'Transactions retrieved successfully.' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction by ID' })
  @ApiOkResponse({ description: 'Transaction retrieved successfully.' })
  async findOne(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.transactionsService.findOne(userId, familyId, id);
    return { data, message: 'Transaction retrieved successfully.' };
  }

  @Post(':id/payments')
  @ApiOperation({
    summary: 'Record a payment against a monthly income transaction',
  })
  @ApiCreatedResponse({ description: 'Income payment recorded successfully.' })
  async recordIncomePayment(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: RecordIncomePaymentDto,
  ) {
    const data = await this.transactionsService.recordIncomePayment(
      userId,
      familyId,
      id,
      dto,
    );
    return { data, message: 'Income payment recorded successfully.' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiOkResponse({ description: 'Transaction updated successfully.' })
  async update(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    const data = await this.transactionsService.update(
      userId,
      familyId,
      id,
      dto,
    );
    return { data, message: 'Transaction updated successfully.' };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a transaction' })
  @ApiOkResponse({ description: 'Transaction approved successfully.' })
  async approve(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.transactionsService.approve(userId, familyId, id);
    return { data, message: 'Transaction approved successfully.' };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a transaction' })
  @ApiOkResponse({ description: 'Transaction rejected successfully.' })
  async reject(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.transactionsService.reject(userId, familyId, id);
    return { data, message: 'Transaction rejected successfully.' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Reverse/soft-delete a transaction' })
  @ApiOkResponse({ description: 'Transaction reversed successfully.' })
  async remove(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.transactionsService.remove(userId, familyId, id);
    return { data, message: 'Transaction reversed successfully.' };
  }
}
