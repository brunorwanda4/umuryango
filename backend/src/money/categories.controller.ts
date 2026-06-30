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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('money-categories')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/families/:familyId/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction category' })
  @ApiCreatedResponse({ description: 'Category created successfully.' })
  async create(
    @Param('familyId') familyId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const data = await this.categoriesService.create(familyId, createCategoryDto);
    return { data, message: 'Category created successfully.' };
  }

  @Get()
  @ApiOperation({ summary: 'List all transaction categories for a family' })
  @ApiOkResponse({ description: 'Categories retrieved successfully.' })
  async findAll(@Param('familyId') familyId: string) {
    const data = await this.categoriesService.findAll(familyId);
    return { data, message: 'Categories retrieved successfully.' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific category by ID' })
  @ApiOkResponse({ description: 'Category retrieved successfully.' })
  async findOne(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.categoriesService.findOne(familyId, id);
    return { data, message: 'Category retrieved successfully.' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiOkResponse({ description: 'Category updated successfully.' })
  async update(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const data = await this.categoriesService.update(familyId, id, updateCategoryDto);
    return { data, message: 'Category updated successfully.' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiOkResponse({ description: 'Category deleted successfully.' })
  async remove(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.categoriesService.remove(familyId, id);
    return { data, message: 'Category deleted successfully.' };
  }
}
