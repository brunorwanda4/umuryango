import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import {
  CreateMilestoneDto,
  CreatePersonalPlanDto,
  ReorderMilestonesDto,
  UpdateMilestoneDto,
  UpdatePersonalPlanDto,
} from './dto/personal-plan.dto';
import { PersonalPlansService } from './personal-plans.service';

@ApiTags('personal plans')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@Controller('api/v1/personal-plans')
@UseGuards(JwtAuthGuard)
export class PersonalPlansController {
  constructor(private readonly plans: PersonalPlansService) {}

  @Get()
  @ApiOperation({ summary: 'List plans for the authenticated person' })
  @ApiOkResponse({ description: 'Only the current person plans are returned.' })
  async list(@CurrentUserId() personId: string) {
    return {
      data: await this.plans.list(personId),
      message: 'Personal plans retrieved successfully.',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a plan for the authenticated person' })
  @ApiCreatedResponse({ description: 'Personal plan created.' })
  async create(
    @CurrentUserId() personId: string,
    @Body() dto: CreatePersonalPlanDto,
  ) {
    return {
      data: await this.plans.create(personId, dto),
      message: 'Plan created successfully.',
    };
  }

  @Patch(':planId')
  async update(
    @CurrentUserId() personId: string,
    @Param('planId') planId: string,
    @Body() dto: UpdatePersonalPlanDto,
  ) {
    return {
      data: await this.plans.update(personId, planId, dto),
      message: 'Plan updated successfully.',
    };
  }

  @Delete(':planId')
  async remove(
    @CurrentUserId() personId: string,
    @Param('planId') planId: string,
  ) {
    return {
      data: await this.plans.remove(personId, planId),
      message: 'Plan deleted successfully.',
    };
  }

  @Post(':planId/milestones')
  async addMilestone(
    @CurrentUserId() personId: string,
    @Param('planId') planId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return {
      data: await this.plans.addMilestone(personId, planId, dto),
      message: 'Milestone added successfully.',
    };
  }

  @Patch(':planId/milestones/:milestoneId')
  async updateMilestone(
    @CurrentUserId() personId: string,
    @Param('planId') planId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return {
      data: await this.plans.updateMilestone(
        personId,
        planId,
        milestoneId,
        dto,
      ),
      message: 'Milestone updated successfully.',
    };
  }

  @Patch(':planId/milestones')
  async reorderMilestones(
    @CurrentUserId() personId: string,
    @Param('planId') planId: string,
    @Body() dto: ReorderMilestonesDto,
  ) {
    return {
      data: await this.plans.reorderMilestones(personId, planId, dto),
      message: 'Milestones reordered successfully.',
    };
  }

  @Delete(':planId/milestones/:milestoneId')
  async removeMilestone(
    @CurrentUserId() personId: string,
    @Param('planId') planId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return {
      data: await this.plans.removeMilestone(personId, planId, milestoneId),
      message: 'Milestone deleted successfully.',
    };
  }
}
