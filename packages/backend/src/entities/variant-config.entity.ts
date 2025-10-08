import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'variant_configs' })
@Index(['variantIndex', 'isActive'])
export class VariantConfig extends BaseEntity {
  @Column({ type: 'int', unique: true, name: 'variant_index' })
  variantIndex: number;

  @Column({ type: 'varchar', length: 100 })
  label: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  instruction: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}
