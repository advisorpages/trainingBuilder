import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { IsEmail, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';
import { Role } from './role.entity';
import { Session } from './session.entity';
import { Incentive } from './incentive.entity';
import { CoachingTip } from './coaching-tip.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ unique: true, length: 255 })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  passwordHash: string;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Role, role => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => Session, session => session.author)
  authoredSessions: Session[];

  @OneToMany(() => Incentive, incentive => incentive.author)
  authoredIncentives: Incentive[];

  @OneToMany(() => CoachingTip, tip => tip.createdByUser)
  createdCoachingTips: CoachingTip[];
}