import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Session } from './session.entity';
import { SessionContentVersion } from './session-content-version.entity';
import { SessionStatusLog } from './session-status-log.entity';
import { Topic } from './topic.entity';
import { Incentive } from './incentive.entity';

export enum UserRole {
  BROKER = 'broker',
  CONTENT_DEVELOPER = 'content_developer',
  TRAINER = 'trainer',
}

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role_enum' })
  role: UserRole;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Session, (session) => session.createdBy)
  createdSessions: Session[];

  @OneToMany(() => Session, (session) => session.updatedBy)
  updatedSessions: Session[];

  @OneToMany(() => SessionContentVersion, (version) => version.createdBy)
  createdContentVersions: SessionContentVersion[];

  @OneToMany(() => SessionContentVersion, (version) => version.acceptedBy)
  acceptedContentVersions: SessionContentVersion[];

  @OneToMany(() => SessionStatusLog, (log) => log.changedBy)
  statusLogs: SessionStatusLog[];


  @OneToMany(() => Incentive, (incentive) => incentive.createdBy)
  createdIncentives: Incentive[];

  @OneToMany(() => Incentive, (incentive) => incentive.updatedBy)
  updatedIncentives: Incentive[];
}
