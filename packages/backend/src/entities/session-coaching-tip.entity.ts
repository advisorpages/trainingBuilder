import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsUUID, IsOptional, IsIn } from 'class-validator';
import { Session } from './session.entity';
import { CoachingTip } from './coaching-tip.entity';
import { User } from './user.entity';

export enum SessionCoachingTipStatus {
  GENERATED = 'generated',
  CURATED = 'curated',
  ARCHIVED = 'archived'
}

@Entity('session_coaching_tips')
export class SessionCoachingTip {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ name: 'session_id' })
  @IsUUID()
  sessionId: string;

  @Column({ name: 'coaching_tip_id' })
  coachingTipId: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: SessionCoachingTipStatus.GENERATED
  })
  @IsIn(Object.values(SessionCoachingTipStatus))
  status: SessionCoachingTipStatus;

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
  @ManyToOne(() => Session, session => session.coachingTips)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => CoachingTip, tip => tip.sessionAssociations)
  @JoinColumn({ name: 'coaching_tip_id' })
  coachingTip: CoachingTip;

  @ManyToOne(() => User, user => user.createdCoachingTips)
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: User;
}