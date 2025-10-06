import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum PromptCategory {
  SESSION_GENERATION = 'session_generation',
  TITLE_CREATION = 'title_creation',
  CONTENT_ENHANCEMENT = 'content_enhancement',
  MARKETING_KIT = 'marketing_kit',
  TRAINING_KIT = 'training_kit',
  VALIDATION = 'validation',
}

@Entity({ name: 'prompts' })
@Index(['category', 'isActive'])
@Index(['name', 'isActive'])
export class Prompt extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: PromptCategory,
    enumName: 'prompt_category_enum',
  })
  category: PromptCategory;

  @Column({ type: 'text' })
  template: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: [] })
  variables: string[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'text', nullable: true, name: 'example_input' })
  exampleInput?: string;

  @Column({ type: 'text', nullable: true, name: 'expected_output' })
  expectedOutput?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}