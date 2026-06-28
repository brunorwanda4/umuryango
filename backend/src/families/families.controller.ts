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
  ApiBadRequestResponse,
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
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ACCESS_COOKIE_NAME } from '../auth/auth.constants';
import { CreateFamilyDto } from './dto/create-family.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateFamilySettingsDto } from './dto/update-family-settings.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
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
          type: 'NUCLEAR',
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
            authority: 'HEAD',
          },
        ],
        message: 'Families retrieved successfully.',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async list(@CurrentUserId() userId: string, @Query('limit') limit?: string) {
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
          type: 'NUCLEAR',
          description: null,
          createdAt: '2026-06-28T07:00:00.000Z',
          authority: 'HEAD',
          capabilities: ['MANAGE_MEMBERS'],
          memberCount: 1,
          members: [
            {
              id: 'clx0000000000000000000001',
              userId: 'clx0000000000000000000002',
              fullName: 'Claudine Mutesi',
              avatarUrl: null,
              authority: 'HEAD',
              kinshipLabel: null,
              kinshipCustom: null,
              capabilities: [],
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

  @Post(':slug/members')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Invite a member to a family workspace' })
  @ApiCreatedResponse({
    description: 'Invite created or refreshed.',
    schema: {
      example: {
        data: { email: 'member@example.com', authority: 'MEMBER' },
        message: 'Family invite sent successfully.',
      },
    },
  })
  @ApiForbiddenResponse({ description: 'The user cannot manage members.' })
  @ApiNotFoundResponse({
    description: 'Family does not exist or the user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async inviteMember(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    const invite = await this.familiesService.inviteMember(
      userId,
      slug,
      inviteMemberDto,
    );

    return {
      data: invite,
      message: 'Family invite sent successfully.',
    };
  }

  @Patch(':slug/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a family member authority or capabilities' })
  @ApiOkResponse({ description: 'Member updated successfully.' })
  @ApiForbiddenResponse({ description: 'The user cannot manage this member.' })
  @ApiNotFoundResponse({
    description: 'Family or member does not exist for this user.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async updateMember(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    const member = await this.familiesService.updateMember(
      userId,
      slug,
      memberId,
      updateMemberDto,
    );

    return {
      data: member,
      message: 'Family member updated successfully.',
    };
  }

  @Delete(':slug/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Soft-remove a family member' })
  @ApiOkResponse({ description: 'Member removed successfully.' })
  @ApiForbiddenResponse({ description: 'The user cannot remove this member.' })
  @ApiNotFoundResponse({
    description: 'Family or member does not exist for this user.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async removeMember(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
  ) {
    const removed = await this.familiesService.removeMember(
      userId,
      slug,
      memberId,
    );

    return {
      data: removed,
      message: 'Family member removed successfully.',
    };
  }

  @Patch(':slug/members/:memberId/head')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Grant head authority to another family member' })
  @ApiOkResponse({ description: 'Head authority granted successfully.' })
  @ApiForbiddenResponse({ description: 'Only a family head can grant head.' })
  @ApiNotFoundResponse({
    description: 'Family or member does not exist for this user.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async grantHead(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
  ) {
    const member = await this.familiesService.grantHead(userId, slug, memberId);

    return {
      data: member,
      message: 'Head authority granted successfully.',
    };
  }

  @Patch(':slug/settings')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update family workspace settings' })
  @ApiOkResponse({ description: 'Family settings updated successfully.' })
  @ApiForbiddenResponse({ description: 'The user cannot manage settings.' })
  @ApiNotFoundResponse({
    description: 'Family does not exist or the user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async updateSettings(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Body() updateFamilySettingsDto: UpdateFamilySettingsDto,
  ) {
    const family = await this.familiesService.updateSettings(
      userId,
      slug,
      updateFamilySettingsDto,
    );

    return {
      data: family,
      message: 'Family settings updated successfully.',
    };
  }

  @Get(':slug/audit')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List recent family permission audit events' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of audit events to return, newest first.',
  })
  @ApiOkResponse({ description: 'Family audit events retrieved successfully.' })
  @ApiForbiddenResponse({ description: 'The user cannot read the audit log.' })
  @ApiNotFoundResponse({
    description: 'Family does not exist or the user is not a member.',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session was found.' })
  async listAudit(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    const events = await this.familiesService.listAudit(
      userId,
      slug,
      parsedLimit && parsedLimit > 0 ? parsedLimit : undefined,
    );

    return {
      data: events,
      message: 'Family audit events retrieved successfully.',
    };
  }
}
