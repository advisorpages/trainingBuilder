import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { SavedVariant } from '../entities/saved-variant.entity';
import { User } from '../entities/user.entity';

export interface CreateSavedVariantData {
  variantId: string;
  outline: any;
  title: string;
  description?: string;
  categoryId?: string;
  sessionType?: string;
  totalDuration?: number;
  ragWeight?: number;
  ragSourcesUsed?: number;
  ragSources?: any[];
  generationSource?: 'rag' | 'baseline' | 'ai';
  variantLabel: string;
  metadata?: any;
  tags?: string[];
  collectionName?: string;
}

export interface UpdateSavedVariantData {
  title?: string;
  description?: string;
  tags?: string[];
  collectionName?: string;
  isFavorite?: boolean;
  order?: number;
}

export interface SavedVariantsListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastUsedAt' | 'usageCount' | 'title';
  sortOrder?: 'ASC' | 'DESC';
  categoryId?: string;
  collectionName?: string;
  isFavorite?: boolean;
  tags?: string[];
  search?: string;
}

export interface SavedVariantsListResult {
  savedVariants: SavedVariant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

@Injectable()
export class SavedVariantsService {
  private readonly logger = new Logger(SavedVariantsService.name);

  constructor(
    @InjectRepository(SavedVariant)
    private readonly savedVariantRepository: Repository<SavedVariant>,
  ) {}

  /**
   * Create a new saved variant for a user
   */
  async createSavedVariant(
    user: User,
    data: CreateSavedVariantData,
  ): Promise<SavedVariant> {
    this.logger.log(`Creating saved variant for user ${user.id}: ${data.title}`);

    // Check if user already saved this variant (prevent duplicates)
    const existing = await this.savedVariantRepository.findOne({
      where: {
        userId: user.id,
        variantId: data.variantId,
      },
    });

    if (existing) {
      this.logger.warn(`User ${user.id} already saved variant ${data.variantId}`);
      throw new ForbiddenException('You have already saved this variant');
    }

    const savedVariant = this.savedVariantRepository.create({
      userId: user.id,
      variantId: data.variantId,
      outline: data.outline,
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      sessionType: data.sessionType,
      totalDuration: data.totalDuration || 0,
      ragWeight: data.ragWeight || 0,
      ragSourcesUsed: data.ragSourcesUsed || 0,
      ragSources: data.ragSources,
      generationSource: data.generationSource || 'ai',
      variantLabel: data.variantLabel,
      metadata: data.metadata,
      tags: data.tags || [],
      collectionName: data.collectionName,
      order: await this.getNextOrderForUser(user.id, data.collectionName),
    });

    return await this.savedVariantRepository.save(savedVariant);
  }

  /**
   * Get a saved variant by ID for a specific user
   */
  async getSavedVariantById(
    user: User,
    id: string,
  ): Promise<SavedVariant> {
    const savedVariant = await this.savedVariantRepository.findOne({
      where: { id, userId: user.id },
    });

    if (!savedVariant) {
      throw new NotFoundException('Saved variant not found');
    }

    return savedVariant;
  }

  /**
   * Get all saved variants for a user with filtering and pagination
   */
  async getSavedVariantsForUser(
    user: User,
    options: SavedVariantsListOptions = {},
  ): Promise<SavedVariantsListResult> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      categoryId,
      collectionName,
      isFavorite,
      tags,
      search,
    } = options;

    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = { userId: user.id };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (collectionName) {
      where.collectionName = collectionName;
    }

    if (typeof isFavorite === 'boolean') {
      where.isFavorite = isFavorite;
    }

    if (tags && tags.length > 0) {
      // Find variants that contain all specified tags
      where.tags = tags; // PostgreSQL array contains operator
    }

    if (search) {
      // Search in title and description
      where.title = search; // TypeORM will handle ILIKE for PostgreSQL
    }

    // Build find options
    const findOptions: FindManyOptions<SavedVariant> = {
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
      relations: ['user'], // Include user relation if needed
    };

    // Execute queries
    const [savedVariants, total] = await this.savedVariantRepository.findAndCount(findOptions);

    const totalPages = Math.ceil(total / limit);

    return {
      savedVariants,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Update a saved variant
   */
  async updateSavedVariant(
    user: User,
    id: string,
    data: UpdateSavedVariantData,
  ): Promise<SavedVariant> {
    const savedVariant = await this.getSavedVariantById(user, id);

    // Update only allowed fields
    if (data.title !== undefined) savedVariant.title = data.title;
    if (data.description !== undefined) savedVariant.description = data.description;
    if (data.tags !== undefined) savedVariant.tags = data.tags;
    if (data.collectionName !== undefined) savedVariant.collectionName = data.collectionName;
    if (data.isFavorite !== undefined) savedVariant.isFavorite = data.isFavorite;
    if (data.order !== undefined) savedVariant.order = data.order;

    return await this.savedVariantRepository.save(savedVariant);
  }

  /**
   * Delete a saved variant
   */
  async deleteSavedVariant(user: User, id: string): Promise<void> {
    const savedVariant = await this.getSavedVariantById(user, id);
    await this.savedVariantRepository.remove(savedVariant);
    this.logger.log(`Deleted saved variant ${id} for user ${user.id}`);
  }

  /**
   * Record usage of a saved variant
   */
  async recordUsage(user: User, id: string): Promise<SavedVariant> {
    const savedVariant = await this.getSavedVariantById(user, id);

    savedVariant.lastUsedAt = new Date();
    savedVariant.usageCount += 1;

    return await this.savedVariantRepository.save(savedVariant);
  }

  /**
   * Get collections (unique collection names) for a user
   */
  async getCollectionsForUser(user: User): Promise<string[]> {
    const result = await this.savedVariantRepository
      .createQueryBuilder('saved_variant')
      .select('DISTINCT saved_variant.collectionName', 'collectionName')
      .where('saved_variant.userId = :userId', { userId: user.id })
      .andWhere('saved_variant.collectionName IS NOT NULL')
      .getRawMany();

    return result.map(row => row.collectionName).filter(Boolean);
  }

  /**
   * Get tags for a user
   */
  async getTagsForUser(user: User): Promise<string[]> {
    const result = await this.savedVariantRepository
      .createQueryBuilder('saved_variant')
      .select('unnest(saved_variant.tags)', 'tag')
      .where('saved_variant.userId = :userId', { userId: user.id })
      .distinct(true)
      .getRawMany();

    return result.map(row => row.tag).filter(Boolean);
  }

  /**
   * Get statistics for a user's saved variants
   */
  async getStatisticsForUser(user: User): Promise<{
    totalSaved: number;
    totalUsage: number;
    favoriteCount: number;
    collectionCount: number;
    recentlyUsed: number; // Used in last 30 days
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalSaved,
      totalUsageResult,
      favoriteCount,
      collectionCountResult,
      recentlyUsed,
    ] = await Promise.all([
      this.savedVariantRepository.count({
        where: { userId: user.id },
      }),
      this.savedVariantRepository
        .createQueryBuilder('saved_variant')
        .select('SUM(saved_variant.usageCount)', 'total')
        .where('saved_variant.userId = :userId', { userId: user.id })
        .getRawOne(),
      this.savedVariantRepository.count({
        where: { userId: user.id, isFavorite: true },
      }),
      this.savedVariantRepository
        .createQueryBuilder('saved_variant')
        .select('COUNT(DISTINCT saved_variant.collectionName)', 'total')
        .where('saved_variant.userId = :userId', { userId: user.id })
        .andWhere('saved_variant.collectionName IS NOT NULL')
        .getRawOne(),
      this.savedVariantRepository.count({
        where: {
          userId: user.id,
          lastUsedAt: thirtyDaysAgo,
        },
      }),
    ]);

    return {
      totalSaved,
      totalUsage: parseInt(totalUsageResult?.total || '0'),
      favoriteCount,
      collectionCount: parseInt(collectionCountResult?.total || '0'),
      recentlyUsed,
    };
  }

  /**
   * Get the next order value for a user's saved variants in a collection
   */
  private async getNextOrderForUser(
    userId: string,
    collectionName?: string,
  ): Promise<number> {
    const result = await this.savedVariantRepository
      .createQueryBuilder('saved_variant')
      .select('MAX(saved_variant.order)', 'maxOrder')
      .where('saved_variant.userId = :userId', { userId })
      .andWhere(
        collectionName
          ? 'saved_variant.collectionName = :collectionName'
          : 'saved_variant.collectionName IS NULL',
        { collectionName },
      )
      .getRawOne();

    return (result?.maxOrder || 0) + 1;
  }

  /**
   * Reorder saved variants within a collection
   */
  async reorderSavedVariants(
    user: User,
    variantIds: string[],
    collectionName?: string,
  ): Promise<void> {
    await this.savedVariantRepository.manager.transaction(async (manager) => {
      for (let i = 0; i < variantIds.length; i++) {
        const variantId = variantIds[i];
        await manager.update(SavedVariant,
          {
            id: variantId,
            userId: user.id,
            collectionName: collectionName || null,
          },
          { order: i + 1 }
        );
      }
    });

    this.logger.log(`Reordered ${variantIds.length} saved variants for user ${user.id}`);
  }
}