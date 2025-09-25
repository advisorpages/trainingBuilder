import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Session } from './session.entity';

@Entity({ name: 'session_agenda_items' })
export class SessionAgendaItem extends BaseEntity {
  @Column({ type: 'int' })
  ordinal: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Session, (session) => session.agendaItems, { onDelete: 'CASCADE' })
  session: Session;
}
