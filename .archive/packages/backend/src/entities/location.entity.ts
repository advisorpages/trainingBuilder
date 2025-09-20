import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, MaxLength, IsOptional, IsInt, Min } from 'class-validator';
import { Session } from './session.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @MaxLength(1000)
  address?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Session, session => session.location)
  sessions: Session[];
}