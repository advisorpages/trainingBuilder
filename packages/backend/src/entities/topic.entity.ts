import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Session } from './session.entity';

@Entity({ name: 'topics' })
export class Topic extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.createdTopics, { nullable: true, onDelete: 'SET NULL' })
  createdBy?: User;

  @ManyToOne(() => User, (user) => user.updatedTopics, { nullable: true, onDelete: 'SET NULL' })
  updatedBy?: User;

  @OneToMany(() => Session, (session) => session.topic)
  sessions: Session[];
}
