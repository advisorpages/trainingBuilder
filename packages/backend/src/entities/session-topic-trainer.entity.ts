import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Session } from './session.entity';
import { Topic } from './topic.entity';
import { Trainer } from './trainer.entity';

@Entity({ name: 'session_topic_trainers' })
export class SessionTopicTrainer {
  @PrimaryColumn({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @PrimaryColumn({ name: 'topic_id', type: 'int' })
  topicId: number;

  @PrimaryColumn({ name: 'trainer_id', type: 'int' })
  trainerId: number;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => Session, (session) => session.sessionTopicTrainers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => Topic, (topic) => topic.sessionTopicTrainers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @ManyToOne(() => Trainer, (trainer) => trainer.sessionTopicTrainers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: Trainer;
}