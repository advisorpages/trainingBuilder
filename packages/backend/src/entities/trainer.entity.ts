import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, MaxLength, IsOptional, IsEmail } from 'class-validator';
import { Session } from './session.entity';

@Entity('trainers')
export class Trainer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Column({ unique: true, nullable: true, length: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @MaxLength(2000)
  bio?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Session, session => session.trainer)
  sessions: Session[];
}