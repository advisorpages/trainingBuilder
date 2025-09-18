import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, OneToMany } from 'typeorm';
import { IsNotEmpty, MaxLength, IsOptional, IsUUID, IsIn } from 'class-validator';
import { User } from './user.entity';
import { Topic } from './topic.entity';
import { SessionCoachingTip } from './session-coaching-tip.entity';

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

@Entity('coaching_tips')
export class CoachingTip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;

  @Column({ length: 100, nullable: true })
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @Column({
    name: 'difficulty_level',
    type: 'varchar',
    length: 20,
    nullable: true
  })
  @IsOptional()
  @IsIn(Object.values(DifficultyLevel))
  difficultyLevel?: DifficultyLevel;

  @Column({ name: 'created_by_user_id', nullable: true })
  @IsOptional()
  @IsUUID()
  createdByUserId?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.createdCoachingTips)
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: User;

  @ManyToMany(() => Topic, topic => topic.coachingTips)
  topics: Topic[];

  @OneToMany(() => SessionCoachingTip, sessionTip => sessionTip.coachingTip)
  sessionAssociations: SessionCoachingTip[];
}