import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariantConfig } from '../entities/variant-config.entity';

@Injectable()
export class VariantConfigService {
  private cache: Map<number, VariantConfig> = new Map();
  private cacheExpiry = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(VariantConfig)
    private readonly variantConfigRepository: Repository<VariantConfig>,
  ) {}

  /**
   * Get variant config by variant index
   */
  async getVariantConfig(variantIndex: number): Promise<VariantConfig> {
    await this.refreshCacheIfNeeded();

    const variant = this.cache.get(variantIndex);
    if (!variant) {
      throw new NotFoundException(`Variant config with index ${variantIndex} not found`);
    }

    if (!variant.isActive) {
      throw new NotFoundException(`Variant config with index ${variantIndex} is not active`);
    }

    return variant;
  }

  /**
   * Get all variant configs
   */
  async getAllVariantConfigs(): Promise<VariantConfig[]> {
    return this.variantConfigRepository.find({
      where: { isActive: true },
      order: { variantIndex: 'ASC' }
    });
  }

  /**
   * Get all variant configs (including inactive)
   */
  async getAllVariantConfigsIncludingInactive(): Promise<VariantConfig[]> {
    return this.variantConfigRepository.find({
      order: { variantIndex: 'ASC' }
    });
  }

  /**
   * Update variant config
   */
  async updateVariantConfig(id: string, data: {
    label?: string;
    description?: string;
    instruction?: string;
    isActive?: boolean;
  }): Promise<VariantConfig> {
    const variant = await this.variantConfigRepository.findOne({ where: { id } });
    if (!variant) {
      throw new NotFoundException(`Variant config with id "${id}" not found`);
    }

    if (data.label !== undefined) variant.label = data.label;
    if (data.description !== undefined) variant.description = data.description;
    if (data.instruction !== undefined) variant.instruction = data.instruction;
    if (data.isActive !== undefined) variant.isActive = data.isActive;

    variant.version += 1;

    const saved = await this.variantConfigRepository.save(variant);
    this.invalidateCache();
    return saved;
  }

  /**
   * Get variant label
   */
  async getVariantLabel(variantIndex: number): Promise<string> {
    const variant = await this.getVariantConfig(variantIndex);
    return variant.label;
  }

  /**
   * Get variant description
   */
  async getVariantDescription(variantIndex: number): Promise<string> {
    const variant = await this.getVariantConfig(variantIndex);
    return variant.description;
  }

  /**
   * Get variant instruction
   */
  async getVariantInstruction(variantIndex: number): Promise<string> {
    const variant = await this.getVariantConfig(variantIndex);
    return variant.instruction;
  }

  /**
   * Refresh cache if needed
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now > this.cacheExpiry) {
      await this.loadCache();
    }
  }

  /**
   * Load all variants into cache
   */
  private async loadCache(): Promise<void> {
    const variants = await this.variantConfigRepository.find();
    this.cache.clear();

    for (const variant of variants) {
      this.cache.set(variant.variantIndex, variant);
    }

    this.cacheExpiry = Date.now() + this.CACHE_TTL;
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(): void {
    this.cacheExpiry = 0;
  }
}
