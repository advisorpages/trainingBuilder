import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, MaxLength, IsOptional, IsUUID, IsEmail, IsInt, Min, IsIn } from 'class-validator';
import { Session } from './session.entity';

export enum SyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed',
  RETRY = 'retry'
}

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ name: 'session_id' })
  @IsUUID()
  sessionId: string;

  @Column({ length: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Column({ length: 255 })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @Column({ length: 50, nullable: true })
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @Column({ name: 'referred_by', length: 255, nullable: true })
  @IsOptional()
  @MaxLength(255)
  referredBy?: string;

  @Column({
    name: 'sync_status',
    type: 'varchar',
    length: 20,
    default: SyncStatus.PENDING
  })
  @IsIn(Object.values(SyncStatus))
  syncStatus: SyncStatus;

  @Column({ name: 'sync_attempts', default: 0 })
  @IsInt()
  @Min(0)
  syncAttempts: number;

  @Column({ name: 'external_id', length: 255, nullable: true })
  @IsOptional()
  @MaxLength(255)
  externalId?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'synced_at', type: 'timestamp', nullable: true })
  @IsOptional()
  syncedAt?: Date;

  // Relationships
  @ManyToOne(() => Session, session => session.registrations, { eager: true })
  @JoinColumn({ name: 'session_id' })
  session: Session;
}