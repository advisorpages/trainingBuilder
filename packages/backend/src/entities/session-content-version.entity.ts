import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Session } from './session.entity';
import { User } from './user.entity';

export enum SessionContentKind {
  HEADLINE = 'headline',
  HERO = 'hero',
  AGENDA_SUMMARY = 'agenda_summary',
  INCENTIVE_BLURB = 'incentive_blurb',
  TRAINER_INTRO = 'trainer_intro',
  EMAIL = 'email',
  CUSTOM = 'custom',
}

export enum ContentSource {
  AI = 'ai',
  HUMAN = 'human',
}

export enum ContentStatus {
  DRAFT = 'draft',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity({ name: 'session_content_versions' })
export class SessionContentVersion extends BaseEntity {
  @ManyToOne(() => Session, (session) => session.contentVersions, { onDelete: 'CASCADE' })
  session: Session;

  @Column({ type: 'enum', enum: SessionContentKind, enumName: 'session_content_kind_enum' })
  kind: SessionContentKind;

  @Column({ type: 'enum', enum: ContentSource, enumName: 'session_content_source_enum' })
  source: ContentSource;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    enumName: 'session_content_status_enum',
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus;

  @Column({ type: 'jsonb' })
  content: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  prompt?: string;

  @Column({ type: 'jsonb', nullable: true })
  promptVariables?: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  generatedAt?: Date;

  @ManyToOne(() => User, (user) => user.createdContentVersions, { nullable: true, onDelete: 'SET NULL' })
  createdBy?: User;

  @ManyToOne(() => User, (user) => user.acceptedContentVersions, { nullable: true, onDelete: 'SET NULL' })
  acceptedBy?: User;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;
}
