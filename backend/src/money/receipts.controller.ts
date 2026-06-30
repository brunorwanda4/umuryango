import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ACCESS_COOKIE_NAME } from '../auth/auth.constants';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@ApiTags('money-receipts')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/families/:familyId/money/receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a receipt for a transaction' })
  @ApiCreatedResponse({ description: 'Receipt metadata saved.' })
  async create(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() dto: CreateReceiptDto,
  ) {
    const data = await this.receiptsService.create(userId, familyId, dto);
    return { data, message: 'Receipt recorded successfully.' };
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'List all receipts for a given transaction' })
  @ApiOkResponse({ description: 'Receipts retrieved successfully.' })
  async findAllByTransaction(
    @Param('familyId') familyId: string,
    @Param('transactionId') transactionId: string,
  ) {
    const data = await this.receiptsService.findAllByTransaction(familyId, transactionId);
    return { data, message: 'Receipts retrieved successfully.' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a receipt' })
  @ApiOkResponse({ description: 'Receipt deleted successfully.' })
  async remove(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.receiptsService.remove(familyId, id);
    return { data, message: 'Receipt deleted successfully.' };
  }
}
