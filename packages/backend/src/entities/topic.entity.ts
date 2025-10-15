import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Session } from './session.entity';
import { SessionTopic } from './session-topic.entity';
import { SessionTopicTrainer } from './session-topic-trainer.entity';
import { Category } from './category.entity';

@Entity({ name: 'topics' })
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'int', name: 'category_id', nullable: true })
  categoryId?: number;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  aiGeneratedContent?: any;

  @Column({ type: 'text', nullable: true })
  learningOutcomes?: string;

  @Column({ type: 'text', nullable: true })
  trainerNotes?: string;

  @Column({ type: 'text', nullable: true })
  materialsNeeded?: string;

  @Column({ type: 'text', nullable: true })
  deliveryGuidance?: string;

  @ManyToOne(() => Category, (category) => category.topics, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @ManyToMany(() => Session, (session) => session.topics)
  sessions: Session[];

  @OneToMany(() => SessionTopic, (sessionTopic) => sessionTopic.topic, {
    cascade: false,
  })
  sessionTopics: SessionTopic[];

  @OneToMany(() => SessionTopicTrainer, (sessionTopicTrainer) => sessionTopicTrainer.topic)
  sessionTopicTrainers: SessionTopicTrainer[];
}
