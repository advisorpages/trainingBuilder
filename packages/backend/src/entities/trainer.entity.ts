import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TrainerAssignment } from './trainer-assignment.entity';
import { Session } from './session.entity';

@Entity({ name: 'trainers' })
export class Trainer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'simple-array', nullable: true })
  expertiseTags?: string[];

  @Column({ nullable: true })
  timezone?: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => TrainerAssignment, (assignment) => assignment.trainer)
  assignments: TrainerAssignment[];

  @OneToMany(() => Session, (session) => session.trainer)
  sessions: Session[];
}
