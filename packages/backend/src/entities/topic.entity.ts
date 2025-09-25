import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Session } from './session.entity';

@Entity({ name: 'topics' })
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
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

  @OneToMany(() => Session, (session) => session.topic)
  sessions: Session[];
}
