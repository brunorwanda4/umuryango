import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
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
}
