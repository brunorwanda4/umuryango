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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('money-categories')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/families/:familyId/money/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction category' })
  @ApiCreatedResponse({ description: 'Category created successfully.' })
  async create(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const data = await this.categoriesService.create(
      familyId,
      createCategoryDto,
      userId,
    );
    return { data, message: 'Category created successfully.' };
  }

  @Post('mine')
  @ApiOperation({ summary: 'Create a personal transaction category' })
  @ApiCreatedResponse({
    description: 'Personal category created successfully.',
  })
  async createPersonal(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const data = await this.categoriesService.createPersonal(
      userId,
      familyId,
      createCategoryDto,
    );
    return { data, message: 'Personal category created successfully.' };
  }

  @Get()
  @ApiOperation({ summary: 'List all transaction categories for a family' })
  @ApiOkResponse({ description: 'Categories retrieved successfully.' })
  async findAll(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
  ) {
    const data = await this.categoriesService.findAll(userId, familyId);
    return { data, message: 'Categories retrieved successfully.' };
  }

  @Get('mine')
  @ApiOperation({ summary: 'List the current user personal categories' })
  @ApiOkResponse({ description: 'Personal categories retrieved successfully.' })
  async findAllPersonal(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
  ) {
    const data = await this.categoriesService.findAllPersonal(userId, familyId);
    return { data, message: 'Personal categories retrieved successfully.' };
  }

  @Patch('mine/:id')
  @ApiOperation({ summary: 'Update a personal category' })
  @ApiOkResponse({ description: 'Personal category updated successfully.' })
  async updatePersonal(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const data = await this.categoriesService.updatePersonal(
      userId,
      familyId,
      id,
      updateCategoryDto,
    );
    return { data, message: 'Personal category updated successfully.' };
  }

  @Delete('mine/:id')
  @ApiOperation({ summary: 'Archive a personal category' })
  @ApiOkResponse({ description: 'Personal category archived successfully.' })
  async removePersonal(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.categoriesService.removePersonal(
      userId,
      familyId,
      id,
    );
    return { data, message: 'Personal category archived successfully.' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific category by ID' })
  @ApiOkResponse({ description: 'Category retrieved successfully.' })
  async findOne(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.categoriesService.findOne(userId, familyId, id);
    return { data, message: 'Category retrieved successfully.' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiOkResponse({ description: 'Category updated successfully.' })
  async update(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const data = await this.categoriesService.update(
      userId,
      familyId,
      id,
      updateCategoryDto,
    );
    return { data, message: 'Category updated successfully.' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a category' })
  @ApiOkResponse({ description: 'Category archived successfully.' })
  async remove(
    @CurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.categoriesService.remove(userId, familyId, id);
    return { data, message: 'Category archived successfully.' };
  }
}
