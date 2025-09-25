import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TrainerAssignment } from './trainer-assignment.entity';

@Entity({ name: 'trainers' })
export class Trainer extends BaseEntity {
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

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => TrainerAssignment, (assignment) => assignment.trainer)
  assignments: TrainerAssignment[];
}
