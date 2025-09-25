import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Session } from './session.entity';

@Entity({ name: 'incentives' })
export class Incentive extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  overview?: string;

  @Column({ type: 'text', nullable: true })
  terms?: string;

  @Column({ type: 'timestamptz', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endDate?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  aiMessaging?: Record<string, unknown>;

  @ManyToOne(() => User, (user) => user.createdIncentives, { nullable: true, onDelete: 'SET NULL' })
  createdBy?: User;

  @ManyToOne(() => User, (user) => user.updatedIncentives, { nullable: true, onDelete: 'SET NULL' })
  updatedBy?: User;

  @ManyToMany(() => Session, (session) => session.incentives)
  @JoinTable({
    name: 'session_incentives',
    joinColumn: { name: 'incentive_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'session_id', referencedColumnName: 'id' },
  })
  sessions: Session[];
}
