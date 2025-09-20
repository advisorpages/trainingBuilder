import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsUUID, IsOptional, MaxLength, IsIn } from 'class-validator';
import { Session } from './session.entity';
import { User } from './user.entity';

// Define SessionStatus enum locally to avoid circular imports
export enum SessionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('session_status_history')
export class SessionStatusHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'session_id' })
  @IsUUID()
  sessionId: string;

  @Column({ name: 'old_status', type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsIn(Object.values(SessionStatus))
  oldStatus?: SessionStatus;

  @Column({ name: 'new_status', type: 'varchar', length: 20 })
  @IsNotEmpty()
  @IsIn(Object.values(SessionStatus))
  newStatus: SessionStatus;

  @Column({ name: 'changed_by', nullable: true })
  @IsOptional()
  @IsUUID()
  changedBy?: string;

  @Column({ name: 'automated_change', default: false })
  automatedChange: boolean;

  @Column({ name: 'change_reason', type: 'text', nullable: true })
  @IsOptional()
  @MaxLength(1000)
  changeReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Session, session => session.statusHistory)
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedByUser?: User;
}