import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Session } from './session.entity';

export enum LocationType {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual',
  HYBRID = 'hybrid',
}

export enum MeetingPlatform {
  ZOOM = 'zoom',
  MICROSOFT_TEAMS = 'microsoft_teams',
  GOOGLE_MEET = 'google_meet',
  OTHER = 'other',
}

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: LocationType,
    default: LocationType.PHYSICAL,
    name: 'location_type'
  })
  locationType: LocationType;

  // Physical location fields
  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'postal_code' })
  postalCode?: string;

  @Column({ type: 'integer', nullable: true })
  capacity?: number;

  // Virtual meeting fields
  @Column({
    type: 'enum',
    enum: MeetingPlatform,
    nullable: true,
    name: 'meeting_platform'
  })
  meetingPlatform?: MeetingPlatform;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'meeting_link' })
  meetingLink?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'meeting_id' })
  meetingId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'meeting_password' })
  meetingPassword?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'dial_in_number' })
  dialInNumber?: string;

  // Common fields
  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone?: string;

  @Column({ type: 'text', nullable: true, name: 'access_instructions' })
  accessInstructions?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Session, session => session.location)
  sessions?: Session[];
}
