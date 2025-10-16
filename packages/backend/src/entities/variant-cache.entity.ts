import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'variant_cache' })
@Index(['cacheKeyHash', 'variantIndex'], { unique: true })
@Index(['expiresAt'])
@Index(['lastAccessed'])
export class VariantCache extends BaseEntity {
  @Column({ type: 'varchar', length: 64, name: 'cache_key_hash' })
  cacheKeyHash: string;

  @Column({ type: 'int', name: 'variant_index' })
  variantIndex: number;

  @Column({ type: 'jsonb', name: 'generated_outline' })
  generatedOutline: Record<string, any>;

  @Column({ type: 'varchar', length: 64, name: 'request_hash' })
  requestHash: string;

  @Column({ type: 'timestamp', name: 'last_accessed', default: () => 'CURRENT_TIMESTAMP' })
  lastAccessed: Date;

  @Column({ type: 'int', default: 0, name: 'hit_count' })
  hitCount: number;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;
}