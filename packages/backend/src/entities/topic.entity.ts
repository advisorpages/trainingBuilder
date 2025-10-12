import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Session } from './session.entity';
import { SessionTopic } from './session-topic.entity';

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

  @ManyToMany(() => Session, (session) => session.topics)
  sessions: Session[];

  @OneToMany(() => SessionTopic, (sessionTopic) => sessionTopic.topic, {
    cascade: false,
  })
  sessionTopics: SessionTopic[];
}
