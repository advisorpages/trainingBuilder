import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SavedVariantsService, SavedVariantsListResult } from '../../services/saved-variants.service';
import { CreateSavedVariantDto, UpdateSavedVariantDto, SavedVariantsQueryDto } from './dto';
import { SavedVariant } from '../../entities/saved-variant.entity';

@ApiTags('saved-variants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('saved-variants')
export class SavedVariantsController {
  constructor(private readonly savedVariantsService: SavedVariantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Save a variant for later use',
    description: 'Save an AI-generated session outline variant to the user\'s personal library',
  })
  @ApiBody({ type: CreateSavedVariantDto })
  @ApiResponse({
    status: 201,
    description: 'Variant saved successfully',
    type: SavedVariant,
  })
  @ApiForbiddenResponse({ description: 'Variant already saved by this user' })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async create(@Request() req, @Body() createSavedVariantDto: CreateSavedVariantDto): Promise<SavedVariant> {
    return await this.savedVariantsService.createSavedVariant(req.user, createSavedVariantDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user\'s saved variants',
    description: 'Retrieve paginated list of user\'s saved variants with filtering options',
  })
  @ApiQuery({ type: SavedVariantsQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Saved variants retrieved successfully',
    schema: {
      properties: {
        savedVariants: { type: 'array', items: { $ref: '#/components/schemas/SavedVariant' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
        hasNext: { type: 'boolean' },
        hasPrev: { type: 'boolean' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async findAll(@Request() req, @Query() query: SavedVariantsQueryDto): Promise<SavedVariantsListResult> {
    return await this.savedVariantsService.getSavedVariantsForUser(req.user, query);
  }

  @Get('collections')
  @ApiOperation({
    summary: 'Get user\'s collections',
    description: 'Retrieve all unique collection names for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Collections retrieved successfully',
    type: [String],
    example: ['Leadership Essentials', 'Communication Skills', 'Team Building'],
  })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async getCollections(@Request() req): Promise<string[]> {
    return await this.savedVariantsService.getCollectionsForUser(req.user);
  }

  @Get('tags')
  @ApiOperation({
    summary: 'Get user\'s tags',
    description: 'Retrieve all unique tags used by the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
    type: [String],
    example: ['leadership', 'communication', 'workshop', 'essential'],
  })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async getTags(@Request() req): Promise<string[]> {
    return await this.savedVariantsService.getTagsForUser(req.user);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get saved variants statistics',
    description: 'Retrieve usage statistics for the user\'s saved variants',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      properties: {
        totalSaved: { type: 'number', example: 25 },
        totalUsage: { type: 'number', example: 48 },
        favoriteCount: { type: 'number', example: 8 },
        collectionCount: { type: 'number', example: 5 },
        recentlyUsed: { type: 'number', example: 12 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async getStatistics(@Request() req): Promise<{
    totalSaved: number;
    totalUsage: number;
    favoriteCount: number;
    collectionCount: number;
    recentlyUsed: number;
  }> {
    return await this.savedVariantsService.getStatisticsForUser(req.user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a saved variant by ID',
    description: 'Retrieve a specific saved variant by ID for the authenticated user',
  })
  @ApiParam({
    name: 'id',
    description: 'Saved variant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Saved variant retrieved successfully',
    type: SavedVariant,
  })
  @ApiNotFoundResponse({ description: 'Saved variant not found' })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async findOne(@Request() req, @Param('id') id: string): Promise<SavedVariant> {
    return await this.savedVariantsService.getSavedVariantById(req.user, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a saved variant',
    description: 'Update metadata for a saved variant (title, description, tags, etc.)',
  })
  @ApiParam({
    name: 'id',
    description: 'Saved variant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateSavedVariantDto })
  @ApiResponse({
    status: 200,
    description: 'Saved variant updated successfully',
    type: SavedVariant,
  })
  @ApiNotFoundResponse({ description: 'Saved variant not found' })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateSavedVariantDto: UpdateSavedVariantDto,
  ): Promise<SavedVariant> {
    return await this.savedVariantsService.updateSavedVariant(req.user, id, updateSavedVariantDto);
  }

  @Post(':id/usage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record usage of a saved variant',
    description: 'Increment usage count and update last used timestamp when a variant is used in a session',
  })
  @ApiParam({
    name: 'id',
    description: 'Saved variant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Usage recorded successfully',
    type: SavedVariant,
  })
  @ApiNotFoundResponse({ description: 'Saved variant not found' })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async recordUsage(@Request() req, @Param('id') id: string): Promise<SavedVariant> {
    return await this.savedVariantsService.recordUsage(req.user, id);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reorder saved variants',
    description: 'Update the order of saved variants within a collection',
  })
  @ApiBody({
    schema: {
      properties: {
        variantIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of variant IDs in the desired order',
        },
        collectionName: {
          type: 'string',
          description: 'Collection name (optional, for uncategorized variants)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Variants reordered successfully',
  })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async reorderVariants(
    @Request() req,
    @Body() body: { variantIds: string[]; collectionName?: string },
  ): Promise<void> {
    await this.savedVariantsService.reorderSavedVariants(
      req.user,
      body.variantIds,
      body.collectionName,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a saved variant',
    description: 'Permanently delete a saved variant from the user\'s library',
  })
  @ApiParam({
    name: 'id',
    description: 'Saved variant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Saved variant deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Saved variant not found' })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async remove(@Request() req, @Param('id') id: string): Promise<void> {
    await this.savedVariantsService.deleteSavedVariant(req.user, id);
  }
}