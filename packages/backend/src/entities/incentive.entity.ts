import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, MaxLength, IsOptional, IsUUID, IsIn } from 'class-validator';
import { User } from './user.entity';

export enum IncentiveStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

@Entity('incentives')
export class Incentive {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ length: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @MaxLength(2000)
  rules?: string;

  @Column({ name: 'start_date', type: 'timestamp' })
  @IsNotEmpty()
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  @IsNotEmpty()
  endDate: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: IncentiveStatus.DRAFT
  })
  @IsIn(Object.values(IncentiveStatus))
  status: IncentiveStatus;

  @Column({ name: 'author_id' })
  @IsUUID()
  authorId: string;

  @Column({ name: 'ai_generated_content', type: 'jsonb', nullable: true })
  @IsOptional()
  aiGeneratedContent?: object;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.authoredIncentives, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: User;
}