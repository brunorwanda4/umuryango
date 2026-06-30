import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@ApiTags('money-budgets')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/families/:familyId/budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiCreatedResponse({ description: 'Budget created successfully.' })
  async create(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() createBudgetDto: CreateBudgetDto,
  ) {
    const data = await this.budgetsService.create(userId, familyId, createBudgetDto);
    return { data: { ...data, amountMinorUnits: data.amountMinorUnits.toString() }, message: 'Budget created successfully.' };
  }

  @Get()
  @ApiOperation({ summary: 'List all budgets for a family' })
  @ApiOkResponse({ description: 'Budgets retrieved successfully.' })
  async findAll(@Param('familyId') familyId: string) {
    const data = await this.budgetsService.findAll(familyId);
    return { data, message: 'Budgets retrieved successfully.' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific budget by ID' })
  @ApiOkResponse({ description: 'Budget retrieved successfully.' })
  async findOne(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.budgetsService.findOne(familyId, id);
    return { data, message: 'Budget retrieved successfully.' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget' })
  @ApiOkResponse({ description: 'Budget updated successfully.' })
  async update(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const data = await this.budgetsService.update(familyId, id, updateBudgetDto);
    return { data, message: 'Budget updated successfully.' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiOkResponse({ description: 'Budget deleted successfully.' })
  async remove(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.budgetsService.remove(familyId, id);
    return { data, message: 'Budget deleted successfully.' };
  }
}
