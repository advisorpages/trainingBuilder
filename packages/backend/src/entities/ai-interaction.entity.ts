import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Session } from './session.entity';
import { User } from './user.entity';
import { Prompt } from './prompt.entity';

export enum AIInteractionStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
}

export enum AIInteractionType {
  OUTLINE_GENERATION = 'outline_generation',
  TITLE_GENERATION = 'title_generation',
  CONTENT_ENHANCEMENT = 'content_enhancement',
  TRAINING_KIT = 'training_kit',
  MARKETING_KIT = 'marketing_kit',
}

export enum UserFeedback {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  MODIFIED = 'modified',
  NO_FEEDBACK = 'no_feedback',
}

@Entity({ name: 'ai_interactions' })
@Index(['session', 'createdAt'])
@Index(['interactionType', 'status'])
@Index(['createdAt'])
export class AIInteraction extends BaseEntity {
  @ManyToOne(() => Session, { nullable: true, onDelete: 'SET NULL' })
  session?: Session;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user?: User;

  @ManyToOne(() => Prompt, { nullable: true, onDelete: 'SET NULL' })
  prompt?: Prompt;

  @Column({
    type: 'enum',
    enum: AIInteractionType,
    enumName: 'ai_interaction_type_enum',
  })
  interactionType: AIInteractionType;

  @Column({
    type: 'enum',
    enum: AIInteractionStatus,
    enumName: 'ai_interaction_status_enum',
  })
  status: AIInteractionStatus;

  // The rendered prompt sent to AI (with variables replaced)
  @Column({ type: 'text' })
  renderedPrompt: string;

  // The raw input variables used
  @Column({ type: 'jsonb' })
  inputVariables: Record<string, any>;

  // The AI response (full output)
  @Column({ type: 'text', nullable: true })
  aiResponse?: string;

  // Parsed/structured output (if applicable)
  @Column({ type: 'jsonb', nullable: true })
  structuredOutput?: Record<string, any>;

  // Error details if failed
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  errorDetails?: Record<string, any>;

  // Performance metrics
  @Column({ type: 'int', nullable: true, name: 'processing_time_ms' })
  processingTimeMs?: number;

  @Column({ type: 'int', nullable: true, name: 'tokens_used' })
  tokensUsed?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, name: 'estimated_cost' })
  estimatedCost?: number;

  // Model information
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'model_used' })
  modelUsed?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'prompt_version' })
  promptVersion?: string;

  // User feedback
  @Column({
    type: 'enum',
    enum: UserFeedback,
    enumName: 'user_feedback_enum',
    default: UserFeedback.NO_FEEDBACK,
    name: 'user_feedback',
  })
  userFeedback: UserFeedback;

  @Column({ type: 'text', nullable: true, name: 'user_feedback_comment' })
  userFeedbackComment?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'feedback_at' })
  feedbackAt?: Date;

  // Quality metrics
  @Column({ type: 'int', nullable: true, name: 'quality_score' })
  qualityScore?: number; // 0-100

  @Column({ type: 'int', nullable: true, name: 'edit_distance' })
  editDistance?: number; // How many characters were changed by user

  // Context metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Audience and tone context (for analytics)
  @Column({ type: 'int', nullable: true, name: 'audience_id' })
  audienceId?: number;

  @Column({ type: 'int', nullable: true, name: 'tone_id' })
  toneId?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'session_type' })
  sessionType?: string;

  // Validation flags
  @Column({ type: 'boolean', default: false, name: 'all_variables_present' })
  allVariablesPresent: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'missing_variables' })
  missingVariables?: string[];
}
