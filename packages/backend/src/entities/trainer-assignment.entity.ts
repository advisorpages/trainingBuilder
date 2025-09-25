import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Session } from './session.entity';
import { Trainer } from './trainer.entity';
import { TrainerAsset } from './trainer-asset.entity';

export enum TrainerAssignmentRole {
  FACILITATOR = 'facilitator',
  ASSISTANT = 'assistant',
  OBSERVER = 'observer',
}

export enum TrainerAssignmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DECLINED = 'declined',
}

@Entity({ name: 'trainer_assignments' })
export class TrainerAssignment extends BaseEntity {
  @ManyToOne(() => Session, (session) => session.trainerAssignments, { onDelete: 'CASCADE' })
  session: Session;

  @ManyToOne(() => Trainer, (trainer) => trainer.assignments, { eager: true, onDelete: 'CASCADE' })
  trainer: Trainer;

  @Column({
    type: 'enum',
    enum: TrainerAssignmentRole,
    enumName: 'trainer_assignment_role_enum',
    default: TrainerAssignmentRole.FACILITATOR,
  })
  role: TrainerAssignmentRole;

  @Column({
    type: 'enum',
    enum: TrainerAssignmentStatus,
    enumName: 'trainer_assignment_status_enum',
    default: TrainerAssignmentStatus.PENDING,
  })
  status: TrainerAssignmentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  assignedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => TrainerAsset, (asset) => asset.assignment, { cascade: true })
  assets: TrainerAsset[];
}
