import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'ai_prompt_settings' })
@Index(['category', 'isCurrent'])
@Index(['category', 'isPinned'])
@Index('ai_prompt_settings_slug_idx', ['slug'], { unique: true })
export class AiPromptSetting extends BaseEntity {
  @Column({ type: 'varchar', length: 80 })
  category: string;

  @Column({ type: 'varchar', length: 120 })
  label: string;

  @Column({ type: 'varchar', length: 140 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  settings: Record<string, any>;

  @Column({ type: 'boolean', name: 'is_current', default: false })
  isCurrent: boolean;

  @Column({ type: 'boolean', name: 'is_pinned', default: false })
  isPinned: boolean;

  @Column({ type: 'boolean', name: 'is_archived', default: false })
  isArchived: boolean;

  @Column({ type: 'varchar', length: 120, name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}

