import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ACCESS_COOKIE_NAME } from '../auth/auth.constants';
import { CreateFamilyDto } from './dto/create-family.dto';
import { FamiliesService } from './families.service';

@ApiTags('families')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@Controller('api/v1/families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create a family workspace and invite the first members',
  })
  @ApiCreatedResponse({
    description: 'Family created with the creator as owner.',
    schema: {
      example: {
        data: {
          id: 'clx0000000000000000000000',
          name: 'Mutesi Family',
          slug: 'mutesi-family',
          country: 'RW',
          defaultCurrency: 'RWF',
          contributionCadence: 'monthly',
          description: null,
          invitedEmails: ['claudine@example.com'],
          createdAt: '2026-06-28T07:00:00.000Z',
        },
        message: 'Family created successfully.',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async create(
    @CurrentUserId() userId: string,
    @Body() createFamilyDto: CreateFamilyDto,
  ) {
    const family = await this.familiesService.create(userId, createFamilyDto);

    return {
      data: family,
      message: 'Family created successfully.',
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List the families the current user belongs to' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of families to return, newest first.',
  })
  @ApiOkResponse({
    description: 'Families the user belongs to, newest membership first.',
    schema: {
      example: {
        data: [
          {
            id: 'clx0000000000000000000000',
            name: 'Mutesi Family',
            slug: 'mutesi-family',
            role: 'OWNER',
          },
        ],
        message: 'Families retrieved successfully.',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async list(
    @CurrentUserId() userId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    const families = await this.familiesService.listForUser(
      userId,
      parsedLimit && parsedLimit > 0 ? parsedLimit : undefined,
    );

    return {
      data: families,
      message: 'Families retrieved successfully.',
    };
  }

  @Get(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get a single family the current user belongs to, with members',
  })
  @ApiOkResponse({
    description: 'Family detail with members and the current user role.',
    schema: {
      example: {
        data: {
          id: 'clx0000000000000000000000',
          name: 'Mutesi Family',
          slug: 'mutesi-family',
          country: 'RW',
          defaultCurrency: 'RWF',
          contributionCadence: 'monthly',
          description: null,
          createdAt: '2026-06-28T07:00:00.000Z',
          role: 'OWNER',
          memberCount: 1,
          members: [
            {
              id: 'clx0000000000000000000001',
              userId: 'clx0000000000000000000002',
              fullName: 'Claudine Mutesi',
              avatarUrl: null,
              role: 'OWNER',
              joinedAt: '2026-06-28T07:00:00.000Z',
            },
          ],
        },
        message: 'Family retrieved successfully.',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Family does not exist or the user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async getBySlug(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
  ) {
    const family = await this.familiesService.getBySlugForUser(userId, slug);

    return {
      data: family,
      message: 'Family retrieved successfully.',
    };
  }
}
