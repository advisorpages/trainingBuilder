import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionBuilderSchema1700000000000 implements MigrationInterface {
  name = 'CreateSessionBuilderSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL UNIQUE,
        "password_hash" varchar NOT NULL,
        "role" varchar NOT NULL,
        "display_name" varchar,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "topics" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "description" text,
        "tags" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by_id" uuid,
        "updated_by_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_topics_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_topics_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incentives" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "overview" text,
        "terms" text,
        "start_date" timestamptz,
        "end_date" timestamptz,
        "is_active" boolean NOT NULL DEFAULT true,
        "ai_messaging" jsonb,
        "created_by_id" uuid,
        "updated_by_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_incentives_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_incentives_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "subtitle" varchar,
        "audience" text,
        "objective" text,
        "status" varchar NOT NULL DEFAULT 'draft',
        "readiness_score" integer NOT NULL DEFAULT 0,
        "scheduled_at" timestamptz,
        "duration_minutes" integer,
        "ai_prompt_context" jsonb,
        "registration_url" text,
        "published_at" timestamptz,
        "topic_id" uuid,
        "landing_page_id" uuid,
        "created_by_id" uuid,
        "updated_by_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_sessions_topic" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_sessions_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_sessions_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "landing_pages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "slug" varchar NOT NULL UNIQUE,
        "template" varchar NOT NULL DEFAULT 'classic',
        "hero_image_url" varchar,
        "content" jsonb NOT NULL,
        "seo_metadata" jsonb,
        "published_at" timestamptz,
        "last_synced_at" timestamptz,
        "session_id" uuid UNIQUE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_landing_pages_session" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "session_agenda_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ordinal" integer NOT NULL,
        "title" varchar NOT NULL,
        "description" text,
        "duration_minutes" integer,
        "notes" text,
        "session_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_session_agenda_items_session" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "session_content_versions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "kind" varchar NOT NULL,
        "source" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'draft',
        "content" jsonb NOT NULL,
        "prompt" text,
        "prompt_variables" jsonb,
        "generated_at" timestamptz,
        "created_by_id" uuid,
        "accepted_by_id" uuid,
        "accepted_at" timestamptz,
        "rejection_reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_content_versions_session" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_content_versions_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_content_versions_accepted_by" FOREIGN KEY ("accepted_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "session_status_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "from_status" varchar NOT NULL,
        "to_status" varchar NOT NULL,
        "changed_by_id" uuid,
        "remark" text,
        "readiness_score" integer,
        "checklist_snapshot" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_status_logs_session" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_status_logs_changed_by" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "trainers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "bio" text,
        "email" varchar NOT NULL UNIQUE,
        "phone" varchar,
        "expertise_tags" text,
        "timezone" varchar,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "trainer_assignments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "trainer_id" uuid NOT NULL,
        "role" varchar NOT NULL DEFAULT 'facilitator',
        "status" varchar NOT NULL DEFAULT 'pending',
        "assigned_at" timestamptz,
        "confirmed_at" timestamptz,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_trainer_assignments_session" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_trainer_assignments_trainer" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "trainer_assets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "assignment_id" uuid NOT NULL,
        "type" varchar NOT NULL,
        "source" varchar NOT NULL,
        "content" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_trainer_assets_assignment" FOREIGN KEY ("assignment_id") REFERENCES "trainer_assignments"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "session_incentives" (
        "session_id" uuid NOT NULL,
        "incentive_id" uuid NOT NULL,
        PRIMARY KEY ("session_id", "incentive_id"),
        CONSTRAINT "fk_si_session" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_si_incentive" FOREIGN KEY ("incentive_id") REFERENCES "incentives"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "session_incentives"');
    await queryRunner.query('DROP TABLE IF EXISTS "trainer_assets"');
    await queryRunner.query('DROP TABLE IF EXISTS "trainer_assignments"');
    await queryRunner.query('DROP TABLE IF EXISTS "trainers"');
    await queryRunner.query('DROP TABLE IF EXISTS "session_status_logs"');
    await queryRunner.query('DROP TABLE IF EXISTS "session_content_versions"');
    await queryRunner.query('DROP TABLE IF EXISTS "session_agenda_items"');
    await queryRunner.query('DROP TABLE IF EXISTS "landing_pages"');
    await queryRunner.query('DROP TABLE IF EXISTS "sessions"');
    await queryRunner.query('DROP TABLE IF EXISTS "incentives"');
    await queryRunner.query('DROP TABLE IF EXISTS "topics"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
  }
}
