import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('saved_variants')
@Index(['userId', 'createdAt'])
@Index(['userId', 'categoryId'])
export class SavedVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'variant_id' })
  variantId: string;

  @Column({ type: 'jsonb' })
  outline: any;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @Column({ name: 'session_type', length: 100, nullable: true })
  sessionType: string;

  @Column({ name: 'total_duration', default: 0 })
  totalDuration: number;

  @Column({ name: 'rag_weight', default: 0 })
  ragWeight: number;

  @Column({ name: 'rag_sources_used', default: 0 })
  ragSourcesUsed: number;

  @Column({ type: 'jsonb', nullable: true })
  ragSources: any[];

  @Column({ name: 'generation_source', length: 20, default: 'ai' })
  generationSource: 'rag' | 'baseline' | 'ai';

  @Column({ name: 'variant_label', length: 255 })
  variantLabel: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ name: 'is_favorite', default: false })
  isFavorite: boolean;

  @Column({ name: 'tags', type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'collection_name', length: 255, nullable: true })
  collectionName: string;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_used_at', nullable: true })
  lastUsedAt: Date;

  @Column({ default: 0 })
  usageCount: number;
}