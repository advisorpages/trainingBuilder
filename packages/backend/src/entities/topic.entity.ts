import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { IsNotEmpty, MaxLength, IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { Session } from './session.entity';
import { CoachingTip } from './coaching-tip.entity';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  // AI Enhancement Fields (following session entity pattern)
  @Column({ name: 'ai_generated_content', type: 'jsonb', nullable: true })
  @IsOptional()
  aiGeneratedContent?: object;

  @Column({ name: 'learning_outcomes', type: 'text', nullable: true })
  @IsOptional()
  learningOutcomes?: string;

  @Column({ name: 'trainer_notes', type: 'text', nullable: true })
  @IsOptional()
  trainerNotes?: string;

  @Column({ name: 'materials_needed', type: 'text', nullable: true })
  @IsOptional()
  materialsNeeded?: string;

  @Column({ name: 'delivery_guidance', type: 'text', nullable: true })
  @IsOptional()
  deliveryGuidance?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Exercise Fields
  @Column({ name: 'is_exercise', default: false })
  isExercise: boolean;

  @Column({
    name: 'exercise_type',
    type: 'varchar',
    length: 50,
    nullable: true
  })
  @IsOptional()
  @IsIn(['discussion', 'activity', 'workshop', 'case-study', 'role-play', 'presentation'])
  exerciseType?: 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play' | 'presentation';

  @Column({ name: 'exercise_instructions', type: 'text', nullable: true })
  @IsOptional()
  exerciseInstructions?: string;

  @Column({ name: 'estimated_duration', default: 30 })
  @IsInt()
  @Min(1)
  estimatedDuration: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToMany(() => Session, session => session.topics)
  sessions: Session[];

  @ManyToMany(() => CoachingTip, tip => tip.topics)
  @JoinTable({
    name: 'topic_coaching_tips',
    joinColumn: { name: 'topic_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tip_id', referencedColumnName: 'id' }
  })
  coachingTips: CoachingTip[];
}