import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Session } from './session.entity';
import { Topic } from './topic.entity';
import { Trainer } from './trainer.entity';
import { SessionTopicTrainer } from './session-topic-trainer.entity';

@Entity({ name: 'session_topics' })
export class SessionTopic {
  @PrimaryColumn({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @PrimaryColumn({ name: 'topic_id', type: 'int' })
  topicId: number;

  @Column({ name: 'trainer_id', type: 'int', nullable: true })
  trainerId?: number;

  @Column({ name: 'sequence_order', type: 'int', default: 1 })
  sequenceOrder: number;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => Session, (session) => session.sessionTopics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => Topic, (topic) => topic.sessionTopics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @ManyToOne(() => Trainer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'trainer_id' })
  trainer?: Trainer;

  // Note: Multiple trainers are handled through the SessionTopicTrainer entity
  // Direct many-to-many relationship is complex due to composite key, so we'll use custom repository methods
}
