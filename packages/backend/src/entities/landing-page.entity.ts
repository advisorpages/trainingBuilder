import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Session } from './session.entity';

export enum LandingPageTemplate {
  CLASSIC = 'classic',
  MODERN = 'modern',
}

@Entity({ name: 'landing_pages' })
export class LandingPage extends BaseEntity {
  @Column({ unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: LandingPageTemplate,
    enumName: 'landing_page_template_enum',
    default: LandingPageTemplate.CLASSIC,
  })
  template: LandingPageTemplate;

  @Column({ nullable: true })
  heroImageUrl?: string;

  @Column({ type: 'jsonb' })
  content: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  seoMetadata?: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @OneToOne(() => Session, (session) => session.landingPage, { onDelete: 'CASCADE' })
  session: Session;
}
