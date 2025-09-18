import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
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

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

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