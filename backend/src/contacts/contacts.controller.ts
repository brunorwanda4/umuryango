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
  ApiTags,
} from '@nestjs/swagger';
import { ACCESS_COOKIE_NAME } from '../auth/auth.constants';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { ContactQueryDto } from './dto/contact-query.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ImportContactsDto } from './dto/import-contacts.dto';

@ApiTags('family-contacts')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/families/:familyId/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List family contacts' })
  @ApiOkResponse({ description: 'Contacts retrieved successfully.' })
  async findMany(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Query() query: ContactQueryDto,
  ) {
    const data = await this.contactsService.findMany(userId, familyId, query);
    return { data, message: 'Contacts retrieved successfully.' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a family contact by ID' })
  @ApiOkResponse({ description: 'Contact retrieved successfully.' })
  async findOne(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.contactsService.findOne(userId, familyId, id);
    return { data, message: 'Contact retrieved successfully.' };
  }

  @Post()
  @ApiOperation({ summary: 'Create a family contact' })
  @ApiCreatedResponse({ description: 'Contact created successfully.' })
  async create(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() dto: CreateContactDto,
  ) {
    const data = await this.contactsService.create(userId, familyId, dto);
    return { data, message: 'Contact created successfully.' };
  }

  @Post('import')
  @ApiOperation({ summary: 'Import family contacts and merge duplicates' })
  @ApiOkResponse({ description: 'Contacts imported successfully.' })
  async importMany(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() dto: ImportContactsDto,
  ) {
    const data = await this.contactsService.importMany(userId, familyId, dto);
    return { data, message: 'Contacts imported successfully.' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a family contact' })
  @ApiOkResponse({ description: 'Contact updated successfully.' })
  async update(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    const data = await this.contactsService.update(userId, familyId, id, dto);
    return { data, message: 'Contact updated successfully.' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a family contact' })
  @ApiOkResponse({ description: 'Contact deleted successfully.' })
  async delete(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.contactsService.delete(userId, familyId, id);
    return { data, message: 'Contact deleted successfully.' };
  }
}
