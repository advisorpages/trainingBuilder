import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Session, SessionStatus } from './session.entity';
import { User } from './user.entity';

@Entity({ name: 'session_status_logs' })
export class SessionStatusLog extends BaseEntity {
  @ManyToOne(() => Session, (session) => session.statusLogs, { onDelete: 'CASCADE' })
  session: Session;

  @Column({ type: 'enum', enum: SessionStatus, enumName: 'session_status_enum' })
  fromStatus: SessionStatus;

  @Column({ type: 'enum', enum: SessionStatus, enumName: 'session_status_enum' })
  toStatus: SessionStatus;

  @ManyToOne(() => User, (user) => user.statusLogs, { nullable: true, onDelete: 'SET NULL' })
  changedBy?: User;

  @Column({ type: 'text', nullable: true })
  remark?: string;

  @Column({ type: 'int', nullable: true })
  readinessScore?: number;

  @Column({ type: 'jsonb', nullable: true })
  checklistSnapshot?: Record<string, unknown>;
}
