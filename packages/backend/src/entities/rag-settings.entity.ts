import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('rag_settings')
export class RagSettings {
  @PrimaryGeneratedColumn()
  id: number;

  // API Configuration
  @Column({ type: 'varchar', length: 500, name: 'api_url', nullable: true })
  apiUrl?: string;

  @Column({ type: 'int', default: 10000, name: 'timeout_ms' })
  timeoutMs: number;

  @Column({ type: 'int', default: 1, name: 'retry_attempts' })
  retryAttempts: number;

  @Column({ type: 'int', default: 8, name: 'max_results' })
  maxResults: number;

  // Scoring Weights (must sum to <= 1.0)
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.5, name: 'similarity_weight' })
  similarityWeight: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.2, name: 'recency_weight' })
  recencyWeight: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.2, name: 'category_weight' })
  categoryWeight: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.1, name: 'base_score' })
  baseScore: number;

  // Filtering
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.65, name: 'similarity_threshold' })
  similarityThreshold: number;

  // Variant RAG Weights
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.8, name: 'variant_1_weight' })
  variant1Weight: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.5, name: 'variant_2_weight' })
  variant2Weight: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.2, name: 'variant_3_weight' })
  variant3Weight: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0, name: 'variant_4_weight' })
  variant4Weight: number;

  // Query Template
  @Column({ type: 'text', name: 'query_template', nullable: true })
  queryTemplate?: string;

  // Feature Flags
  @Column({ type: 'boolean', default: true, name: 'enabled' })
  enabled: boolean;

  @Column({ type: 'boolean', default: true, name: 'use_category_filter' })
  useCategoryFilter: boolean;

  @Column({ type: 'boolean', default: true, name: 'use_recency_scoring' })
  useRecencyScoring: boolean;

  // Metadata
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'last_tested_by' })
  lastTestedBy?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_tested_at' })
  lastTestedAt?: Date;

  @Column({ type: 'varchar', length: 50, default: 'never', name: 'last_test_status' })
  lastTestStatus: string; // 'success', 'failed', 'never'

  @Column({ type: 'text', nullable: true, name: 'last_test_message' })
  lastTestMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
