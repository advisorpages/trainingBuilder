import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { IsNotEmpty, MaxLength, IsOptional, IsUUID, IsInt, Min, IsIn } from 'class-validator';
import { User } from './user.entity';
import { Location } from './location.entity';
import { Trainer } from './trainer.entity';
import { Audience } from './audience.entity';
import { Tone } from './tone.entity';
import { Category } from './category.entity';
import { Topic } from './topic.entity';
import { Registration } from './registration.entity';
import { SessionStatusHistory } from './session-status-history.entity';
import { SessionCoachingTip } from './session-coaching-tip.entity';

export enum SessionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ length: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @Column({ name: 'start_time', type: 'timestamp' })
  @IsNotEmpty()
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  @IsNotEmpty()
  endTime: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: SessionStatus.DRAFT
  })
  @IsIn(Object.values(SessionStatus))
  status: SessionStatus;

  @Column({ name: 'qr_code_url', type: 'text', nullable: true })
  @IsOptional()
  qrCodeUrl?: string;

  @Column({ name: 'author_id' })
  @IsUUID()
  authorId: string;

  @Column({ name: 'location_id', nullable: true })
  @IsOptional()
  @IsInt()
  locationId?: number;

  @Column({ name: 'trainer_id', nullable: true })
  @IsOptional()
  @IsInt()
  trainerId?: number;

  @Column({ name: 'audience_id', nullable: true })
  @IsOptional()
  @IsInt()
  audienceId?: number;

  @Column({ name: 'tone_id', nullable: true })
  @IsOptional()
  @IsInt()
  toneId?: number;

  @Column({ name: 'category_id', nullable: true })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @Column({ name: 'max_registrations', default: 50 })
  @IsInt()
  @Min(1)
  maxRegistrations: number;

  @Column({ name: 'ai_prompt', type: 'text', nullable: true })
  @IsOptional()
  aiPrompt?: string;

  @Column({ name: 'ai_generated_content', type: 'text', nullable: true })
  @IsOptional()
  aiGeneratedContent?: string;

  // Promotional content fields for Story 2.6
  @Column({ name: 'promotional_headline', type: 'text', nullable: true })
  @IsOptional()
  promotionalHeadline?: string;

  @Column({ name: 'promotional_summary', type: 'text', nullable: true })
  @IsOptional()
  promotionalSummary?: string;

  @Column({ name: 'key_benefits', type: 'text', nullable: true })
  @IsOptional()
  keyBenefits?: string;

  @Column({ name: 'call_to_action', type: 'text', nullable: true })
  @IsOptional()
  callToAction?: string;

  @Column({ name: 'social_media_content', type: 'text', nullable: true })
  @IsOptional()
  socialMediaContent?: string;

  @Column({ name: 'email_marketing_content', type: 'text', nullable: true })
  @IsOptional()
  emailMarketingContent?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Publishing logic fields (Story 3.3)
  @Column({ name: 'status_changed_at', type: 'timestamp', nullable: true })
  statusChangedAt?: Date;

  @Column({ name: 'status_changed_by', nullable: true })
  @IsOptional()
  @IsUUID()
  statusChangedBy?: string;

  @Column({ name: 'automated_status_change', default: false })
  automatedStatusChange: boolean;

  @Column({ name: 'content_validation_status', type: 'varchar', length: 20, default: 'pending' })
  @IsIn(['pending', 'valid', 'invalid'])
  contentValidationStatus: string;

  @Column({ name: 'content_validation_errors', type: 'json', nullable: true })
  contentValidationErrors?: string[];

  @Column({ name: 'publication_requirements_met', default: false })
  publicationRequirementsMet: boolean;

  @Column({ name: 'last_validation_check', type: 'timestamp', nullable: true })
  lastValidationCheck?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.authoredSessions, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => Location, location => location.sessions, { eager: true })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @ManyToOne(() => Trainer, trainer => trainer.sessions, { eager: true })
  @JoinColumn({ name: 'trainer_id' })
  trainer?: Trainer;

  @ManyToOne(() => Audience, audience => audience.sessions)
  @JoinColumn({ name: 'audience_id' })
  audience?: Audience;

  @ManyToOne(() => Tone, tone => tone.sessions)
  @JoinColumn({ name: 'tone_id' })
  tone?: Tone;

  @ManyToOne(() => Category, category => category.sessions)
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @ManyToMany(() => Topic, topic => topic.sessions)
  @JoinTable({
    name: 'session_topics',
    joinColumn: { name: 'session_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'topic_id', referencedColumnName: 'id' }
  })
  topics: Topic[];

  @OneToMany(() => Registration, registration => registration.session)
  registrations: Registration[];

  @OneToMany(() => SessionStatusHistory, statusHistory => statusHistory.session)
  statusHistory: SessionStatusHistory[];

  @OneToMany(() => SessionCoachingTip, tip => tip.session)
  coachingTips: SessionCoachingTip[];
}