import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { Session } from './session.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @OneToMany(() => Session, session => session.category)
  sessions: Session[];
}