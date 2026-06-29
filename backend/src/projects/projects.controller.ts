import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
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
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@Controller('api/v1/families/:familyId/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'Aggregate family project budgets, contributions, members, and updates',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'planned', 'completed', 'all'],
    description: 'Project status filter. Defaults to active.',
  })
  @ApiOkResponse({ description: 'Project overview generated from records.' })
  @ApiNotFoundResponse({
    description: 'Family does not exist or the user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async getOverview(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Query('status') status?: string,
  ) {
    const data = await this.projectsService.getOverview(
      userId,
      familyId,
      status,
    );

    return { data, message: 'Project overview retrieved successfully.' };
  }

  @Post()
  @ApiOperation({ summary: 'Create a family project plan' })
  @ApiCreatedResponse({ description: 'Project plan created.' })
  @ApiForbiddenResponse({ description: 'The user cannot manage projects.' })
  @ApiNotFoundResponse({
    description: 'Family does not exist or the user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async create(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() dto: CreateProjectDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const data = await this.projectsService.create(
      userId,
      familyId,
      dto,
      idempotencyKey,
    );

    return { data, message: 'Project plan created successfully.' };
  }
}
