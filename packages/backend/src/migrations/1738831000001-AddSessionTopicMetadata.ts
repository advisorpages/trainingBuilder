import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionTopicMetadata1738831000001 implements MigrationInterface {
  name = 'AddSessionTopicMetadata1738831000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "session_topics"
      ADD COLUMN IF NOT EXISTS "trainer_id" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "session_topics"
      ADD COLUMN IF NOT EXISTS "sequence_order" integer DEFAULT 1
    `);

    await queryRunner.query(`
      ALTER TABLE "session_topics"
      ALTER COLUMN "sequence_order" SET DEFAULT 1
    `);

    await queryRunner.query(`
      UPDATE "session_topics"
      SET "sequence_order" = 1
      WHERE "sequence_order" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "session_topics"
      ADD COLUMN IF NOT EXISTS "duration_minutes" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "session_topics"
      ADD COLUMN IF NOT EXISTS "notes" text
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_session_topics_trainer'
            AND table_name = 'session_topics'
        ) THEN
          ALTER TABLE "session_topics"
          ADD CONSTRAINT "fk_session_topics_trainer"
          FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE SET NULL;
        END IF;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_session_topics_trainer_id"
      ON "session_topics" ("trainer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_session_topics_sequence_order"
      ON "session_topics" ("session_id", "sequence_order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_session_topics_sequence_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_session_topics_trainer_id"`);
    await queryRunner.query(`
      ALTER TABLE "session_topics"
      DROP CONSTRAINT IF EXISTS "fk_session_topics_trainer"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_topics"
      DROP COLUMN IF EXISTS "notes"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_topics"
      DROP COLUMN IF EXISTS "duration_minutes"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_topics"
      DROP COLUMN IF EXISTS "sequence_order"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_topics"
      DROP COLUMN IF EXISTS "trainer_id"
    `);
  }
}
