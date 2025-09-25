import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTopicsSchema1702000000003 implements MigrationInterface {
  name = 'UpdateTopicsSchema1702000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP CONSTRAINT IF EXISTS "fk_sessions_topic"
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP COLUMN IF EXISTS "topic_id"
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "topics_tmp" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar NOT NULL UNIQUE,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "ai_generated_content" jsonb,
        "learning_outcomes" text,
        "trainer_notes" text,
        "materials_needed" text,
        "delivery_guidance" text
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_name = 'topics'
            AND table_schema = current_schema()
        ) THEN
          INSERT INTO "topics_tmp" (
            "name",
            "description",
            "is_active",
            "created_at",
            "updated_at"
          )
          SELECT
            "name",
            "description",
            COALESCE("is_active", true),
            COALESCE("created_at", now()),
            COALESCE("updated_at", now())
          FROM "topics";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "topics"`);

    await queryRunner.query(`ALTER TABLE "topics_tmp" RENAME TO "topics"`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_class
          WHERE relname = 'topics_tmp_id_seq'
        ) THEN
          ALTER SEQUENCE "topics_tmp_id_seq" RENAME TO "topics_id_seq";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "topic_id" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD CONSTRAINT "fk_sessions_topic"
      FOREIGN KEY ("topic_id")
      REFERENCES "topics"("id")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP CONSTRAINT IF EXISTS "fk_sessions_topic"
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP COLUMN IF EXISTS "topic_id"
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "topics"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "topics" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "description" text,
        "tags" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by_id" uuid,
        "updated_by_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
  }
}
