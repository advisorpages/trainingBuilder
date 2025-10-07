import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Session } from './session.entity';

export enum AudienceExperienceLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  MIXED = 'mixed',
}

export enum AudienceCommunicationStyle {
  FORMAL = 'formal',
  CONVERSATIONAL = 'conversational',
  TECHNICAL = 'technical',
  SIMPLIFIED = 'simplified',
}

export enum AudienceVocabularyLevel {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  EXPERT = 'expert',
  INDUSTRY_SPECIFIC = 'industry_specific',
}

@Entity('audiences')
export class Audience {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: AudienceExperienceLevel,
    enumName: 'audience_experience_level_enum',
    default: AudienceExperienceLevel.INTERMEDIATE,
    name: 'experience_level',
  })
  experienceLevel: AudienceExperienceLevel;

  @Column({ type: 'int', default: 3, name: 'technical_depth' })
  technicalDepth: number; // 1-5 scale

  @Column({ type: 'text', nullable: true, name: 'preferred_learning_style' })
  preferredLearningStyle?: string; // e.g., "visual, hands-on, theoretical, discussion-based"

  @Column({
    type: 'enum',
    enum: AudienceCommunicationStyle,
    enumName: 'audience_communication_style_enum',
    default: AudienceCommunicationStyle.CONVERSATIONAL,
    name: 'communication_style',
  })
  communicationStyle: AudienceCommunicationStyle;

  @Column({ type: 'jsonb', default: [], name: 'example_types' })
  exampleTypes: string[]; // Array of relevant example contexts

  @Column({ type: 'jsonb', default: [], name: 'avoid_topics' })
  avoidTopics: string[]; // Array of topics to avoid

  @Column({
    type: 'enum',
    enum: AudienceVocabularyLevel,
    enumName: 'audience_vocabulary_level_enum',
    default: AudienceVocabularyLevel.PROFESSIONAL,
    name: 'vocabulary_level',
  })
  vocabularyLevel: AudienceVocabularyLevel;

  @Column({ type: 'text', nullable: true, name: 'prompt_instructions' })
  promptInstructions?: string; // Direct AI instructions

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Session, session => session.audience)
  sessions?: Session[];
}
