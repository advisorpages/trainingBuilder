import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { VariantCache } from '../entities/variant-cache.entity';
import { OpenAISessionOutline, OpenAISessionOutlineRequest } from './openai.service';
import { AIInteractionsService } from './ai-interactions.service';
import { AIInteractionType, AIInteractionStatus } from '../entities/ai-interaction.entity';

export interface CacheKeyParams {
  title?: string;
  category: string;
  sessionType: string;
  duration: number;
  desiredOutcome: string;
  currentProblem?: string;
  specificTopics?: string;
  audienceSize?: string;
  audienceId?: number;
  toneId?: number;
  locationId?: number;
  meetingPlatform?: string;
  variantIndex: number;
  variantInstruction: string;
  ragWeight: number;
  ragSourcesHash?: string;
}

export interface CacheResult {
  hit: boolean;
  outline?: OpenAISessionOutline;
  cacheEntry?: VariantCache;
}

@Injectable()
export class VariantCacheService {
  private readonly logger = new Logger(VariantCacheService.name);
  private readonly isEnabled: boolean;
  private readonly ttlDays: number;
  private readonly maxCacheSizeMB: number;

  constructor(
    @InjectRepository(VariantCache)
    private readonly variantCacheRepository: Repository<VariantCache>,
    private readonly configService: ConfigService,
    private readonly aiInteractionsService: AIInteractionsService,
  ) {
    this.isEnabled = this.configService.get<boolean>('ENABLE_VARIANT_CACHING', true);
    this.ttlDays = this.configService.get<number>('VARIANT_CACHE_TTL_DAYS', 30);
    this.maxCacheSizeMB = this.configService.get<number>('VARIANT_CACHE_MAX_SIZE_MB', 500);

    if (this.isEnabled) {
      this.logger.log(`Variant caching enabled - TTL: ${this.ttlDays} days, Max size: ${this.maxCacheSizeMB}MB`);
    } else {
      this.logger.log('Variant caching disabled by configuration');
    }
  }

  /**
   * Generate a deterministic cache key from request parameters
   */
  generateCacheKey(params: CacheKeyParams): string {
    // Only include fields that materially affect the generated content
    const keyData = {
      category: params.category,
      sessionType: params.sessionType,
      duration: params.duration,
      desiredOutcome: params.desiredOutcome,
      currentProblem: params.currentProblem,
      specificTopics: params.specificTopics,
      audienceSize: params.audienceSize,
      audienceId: params.audienceId,
      toneId: params.toneId,
      locationId: params.locationId,
      meetingPlatform: params.meetingPlatform,
      variantIndex: params.variantIndex,
      variantInstruction: params.variantInstruction,
      ragWeight: params.ragWeight,
      ragSourcesHash: params.ragSourcesHash,
    };

    const keyString = JSON.stringify(keyData, Object.keys(keyData).sort());
    return crypto.createHash('sha256').update(keyString).digest('hex');
  }

  /**
   * Generate a hash of the full request for collision detection
   */
  generateRequestHash(request: OpenAISessionOutlineRequest): string {
    const requestString = JSON.stringify(request, Object.keys(request).sort());
    return crypto.createHash('sha256').update(requestString).digest('hex');
  }

  /**
   * Generate a hash of RAG sources for cache invalidation
   */
  generateRagSourcesHash(ragResults: any[]): string {
    if (!ragResults || ragResults.length === 0) {
      return 'no-rag';
    }

    // Use only the top few sources and their identifiers for hashing
    const sourcesForHash = ragResults.slice(0, 5).map(r => ({
      filename: r.metadata?.filename || 'unknown',
      id: r.id || 'no-id',
      similarity: r.similarity || 0,
    }));

    const sourcesString = JSON.stringify(sourcesForHash);
    return crypto.createHash('sha256').update(sourcesString).digest('hex').substring(0, 16);
  }

  /**
   * Try to retrieve a cached variant
   */
  async getCachedVariant(
    params: CacheKeyParams,
    request: OpenAISessionOutlineRequest,
  ): Promise<CacheResult> {
    if (!this.isEnabled) {
      return { hit: false };
    }

    try {
      const cacheKeyHash = this.generateCacheKey(params);
      const requestHash = this.generateRequestHash(request);

      const cacheEntry = await this.variantCacheRepository.findOne({
        where: {
          cacheKeyHash,
          variantIndex: params.variantIndex,
          expiresAt: LessThan ? undefined : undefined, // We'll handle expiration manually
        },
      });

      if (!cacheEntry) {
        this.logger.debug(`Cache miss for key ${cacheKeyHash.substring(0, 8)}... variant ${params.variantIndex}`);
        return { hit: false };
      }

      // Check if expired
      if (cacheEntry.expiresAt < new Date()) {
        this.logger.debug(`Cache expired for key ${cacheKeyHash.substring(0, 8)}... variant ${params.variantIndex}`);
        await this.variantCacheRepository.remove(cacheEntry);
        return { hit: false };
      }

      // Check for request collision (should rarely happen)
      if (cacheEntry.requestHash !== requestHash) {
        this.logger.warn(`Cache collision detected for key ${cacheKeyHash.substring(0, 8)}... variant ${params.variantIndex}`);
        await this.variantCacheRepository.remove(cacheEntry);
        return { hit: false };
      }

      // Update access tracking
      cacheEntry.lastAccessed = new Date();
      cacheEntry.hitCount += 1;
      await this.variantCacheRepository.save(cacheEntry);

      this.logger.log(`Cache hit for key ${cacheKeyHash.substring(0, 8)}... variant ${params.variantIndex} (hits: ${cacheEntry.hitCount})`);

      // Log cache hit analytics
      try {
        await this.aiInteractionsService.create({
          interactionType: AIInteractionType.VARIANT_CACHE_HIT,
          status: AIInteractionStatus.SUCCESS,
          renderedPrompt: 'Variant cache hit',
          inputVariables: {
            variantIndex: params.variantIndex,
            cacheKeyHash: cacheKeyHash,
            hitCount: cacheEntry.hitCount,
            category: params.category,
            sessionType: params.sessionType,
          },
          metadata: {
            cacheEntryId: cacheEntry.id,
            cacheAge: Date.now() - cacheEntry.createdAt.getTime(),
            lastAccessed: cacheEntry.lastAccessed,
            expiresAt: cacheEntry.expiresAt,
          },
          category: params.category,
          sessionType: params.sessionType,
        });
      } catch (error) {
        this.logger.error('Failed to log cache hit analytics:', error);
      }

      return {
        hit: true,
        outline: cacheEntry.generatedOutline as OpenAISessionOutline,
        cacheEntry,
      };

    } catch (error) {
      this.logger.error('Error retrieving cached variant:', error);
      return { hit: false };
    }
  }

  /**
   * Store a generated variant in cache
   */
  async cacheVariant(
    params: CacheKeyParams,
    request: OpenAISessionOutlineRequest,
    outline: OpenAISessionOutline,
  ): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const cacheKeyHash = this.generateCacheKey(params);
      const requestHash = this.generateRequestHash(request);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.ttlDays);

      // Check if entry already exists (shouldn't happen with unique constraint, but be safe)
      const existing = await this.variantCacheRepository.findOne({
        where: {
          cacheKeyHash,
          variantIndex: params.variantIndex,
        },
      });

      if (existing) {
        this.logger.debug(`Cache entry already exists for key ${cacheKeyHash.substring(0, 8)}... variant ${params.variantIndex}`);
        return;
      }

      const cacheEntry = this.variantCacheRepository.create({
        cacheKeyHash,
        variantIndex: params.variantIndex,
        generatedOutline: outline,
        requestHash,
        expiresAt,
      });

      await this.variantCacheRepository.save(cacheEntry);

      this.logger.log(`Cached variant for key ${cacheKeyHash.substring(0, 8)}... variant ${params.variantIndex}`);

      // Trigger cleanup if we're getting close to size limit
      await this.checkAndTriggerCleanup();

    } catch (error) {
      this.logger.error('Error caching variant:', error);
    }
  }

  /**
   * Clean up expired entries and enforce size limits
   */
  async cleanupExpiredEntries(): Promise<number> {
    if (!this.isEnabled) {
      return 0;
    }

    try {
      const now = new Date();
      const result = await this.variantCacheRepository.delete({
        expiresAt: LessThan(now),
      });

      const deletedCount = result.affected || 0;
      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} expired cache entries`);
      }

      return deletedCount;

    } catch (error) {
      this.logger.error('Error cleaning up expired cache entries:', error);
      return 0;
    }
  }

  /**
   * Enforce cache size limits using LRU eviction
   */
  async enforceSizeLimit(): Promise<number> {
    if (!this.isEnabled) {
      return 0;
    }

    try {
      // Estimate current cache size (rough approximation)
      const currentCount = await this.variantCacheRepository.count();
      const estimatedSizeMB = currentCount * 0.1; // Rough estimate: 100KB per entry

      if (estimatedSizeMB <= this.maxCacheSizeMB) {
        return 0;
      }

      // Calculate how many entries to remove
      const targetCount = Math.floor((this.maxCacheSizeMB * 0.8) / 0.1); // Leave 20% headroom
      const entriesToRemove = Math.max(0, currentCount - targetCount);

      if (entriesToRemove === 0) {
        return 0;
      }

      // Remove oldest entries by last_accessed
      const oldestEntries = await this.variantCacheRepository.find({
        order: {
          lastAccessed: 'ASC',
        },
        take: entriesToRemove,
      });

      await this.variantCacheRepository.remove(oldestEntries);

      this.logger.log(`Evicted ${oldestEntries.length} entries to enforce cache size limit`);
      return oldestEntries.length;

    } catch (error) {
      this.logger.error('Error enforcing cache size limit:', error);
      return 0;
    }
  }

  /**
   * Check if cleanup is needed and trigger it
   */
  private async checkAndTriggerCleanup(): Promise<void> {
    try {
      // Run cleanup in background without blocking
      setTimeout(async () => {
        await this.cleanupExpiredEntries();
        await this.enforceSizeLimit();
      }, 0);

    } catch (error) {
      this.logger.error('Error in background cache cleanup:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    averageHitsPerEntry: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    estimatedSizeMB: number;
  }> {
    try {
      const [totalEntries, totalHitsResult, oldestResult, newestResult] = await Promise.all([
        this.variantCacheRepository.count(),
        this.variantCacheRepository
          .createQueryBuilder('cache')
          .select('SUM(cache.hitCount)', 'total')
          .getRawOne(),
        this.variantCacheRepository
          .createQueryBuilder('cache')
          .select('MIN(cache.lastAccessed)', 'oldest')
          .getRawOne(),
        this.variantCacheRepository
          .createQueryBuilder('cache')
          .select('MAX(cache.lastAccessed)', 'newest')
          .getRawOne(),
      ]);

      const totalHits = parseInt(totalHitsResult?.total || '0');
      const averageHitsPerEntry = totalEntries > 0 ? totalHits / totalEntries : 0;
      const estimatedSizeMB = totalEntries * 0.1; // Rough estimate

      return {
        totalEntries,
        totalHits,
        averageHitsPerEntry: Math.round(averageHitsPerEntry * 100) / 100,
        oldestEntry: oldestResult?.oldest ? new Date(oldestResult.oldest) : undefined,
        newestEntry: newestResult?.newest ? new Date(newestResult.newest) : undefined,
        estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100,
      };

    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalHits: 0,
        averageHitsPerEntry: 0,
        estimatedSizeMB: 0,
      };
    }
  }

  /**
   * Clear all cache entries (admin function)
   */
  async clearCache(): Promise<number> {
    if (!this.isEnabled) {
      return 0;
    }

    try {
      const result = await this.variantCacheRepository.delete({});
      const deletedCount = result.affected || 0;
      this.logger.log(`Cleared ${deletedCount} cache entries`);
      return deletedCount;

    } catch (error) {
      this.logger.error('Error clearing cache:', error);
      return 0;
    }
  }
}