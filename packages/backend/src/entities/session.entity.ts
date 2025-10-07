import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Topic } from './topic.entity';
import { Incentive } from './incentive.entity';
import { LandingPage } from './landing-page.entity';
import { SessionAgendaItem } from './session-agenda-item.entity';
import { SessionContentVersion } from './session-content-version.entity';
import { TrainerAssignment } from './trainer-assignment.entity';
import { SessionStatusLog } from './session-status-log.entity';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Location } from './location.entity';
import { Audience } from './audience.entity';
import { Tone } from './tone.entity';

export enum SessionStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  READY = 'ready',
  PUBLISHED = 'published',
  RETIRED = 'retired',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'sessions' })
@Index(['status', 'scheduledAt'])
export class Session extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle?: string;

  @Column({ type: 'text', nullable: true })
  objective?: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    enumName: 'session_status_enum',
    default: SessionStatus.DRAFT,
  })
  status: SessionStatus;

  @Column({ type: 'int', default: 0 })
  readinessScore: number;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'jsonb', nullable: true })
  aiPromptContext?: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  registrationUrl?: string;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'int', name: 'location_id', nullable: true })
  locationId?: number;

  @Column({ type: 'int', name: 'audience_id', nullable: true })
  audienceId?: number;

  @Column({ type: 'int', name: 'tone_id', nullable: true })
  toneId?: number;

  @Column({ type: 'int', name: 'category_id', nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, (category) => category.sessions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @ManyToOne(() => Location, (location) => location.sessions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @ManyToOne(() => Audience, (audience) => audience.sessions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'audience_id' })
  audience?: Audience;

  @ManyToOne(() => Tone, (tone) => tone.sessions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tone_id' })
  tone?: Tone;

  @ManyToOne(() => Topic, (topic) => topic.sessions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'topic_id' })
  topic?: Topic;

  @ManyToMany(() => Incentive, (incentive) => incentive.sessions)
  incentives: Incentive[];

  @OneToOne(() => LandingPage, (landingPage) => landingPage.session, {
    cascade: true,
    eager: false,
  })
  @JoinColumn({ name: 'landing_page_id' })
  landingPage?: LandingPage;

  @OneToMany(() => SessionAgendaItem, (agenda) => agenda.session, {
    cascade: true,
  })
  agendaItems: SessionAgendaItem[];

  @OneToMany(() => SessionContentVersion, (version) => version.session, {
    cascade: true,
  })
  contentVersions: SessionContentVersion[];

  @OneToMany(() => TrainerAssignment, (assignment) => assignment.session, {
    cascade: true,
  })
  trainerAssignments: TrainerAssignment[];

  @OneToMany(() => SessionStatusLog, (log) => log.session, { cascade: true })
  statusLogs: SessionStatusLog[];

  @ManyToOne(() => User, (user) => user.createdSessions, { nullable: true, onDelete: 'SET NULL' })
  createdBy?: User;

  @ManyToOne(() => User, (user) => user.updatedSessions, { nullable: true, onDelete: 'SET NULL' })
  updatedBy?: User;
}
