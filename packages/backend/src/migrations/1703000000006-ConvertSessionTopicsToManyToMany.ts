import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertSessionTopicsToManyToMany1703000000006 implements MigrationInterface {
  name = 'ConvertSessionTopicsToManyToMany1703000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Copy any existing single-topic relationship data into the join table
    await queryRunner.query(`
      INSERT INTO "session_topics" ("session_id", "topic_id", "created_at")
      SELECT s."id", s."topic_id", NOW()
      FROM "sessions" s
      WHERE s."topic_id" IS NOT NULL
      ON CONFLICT ("session_id", "topic_id") DO NOTHING
    `);

    // Drop the old foreign key constraint and column
    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP CONSTRAINT IF EXISTS "fk_sessions_topic"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_sessions_topic_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP COLUMN IF EXISTS "topic_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the column
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "topic_id" integer
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_topic_id"
      ON "sessions" ("topic_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD CONSTRAINT "fk_sessions_topic"
      FOREIGN KEY ("topic_id")
      REFERENCES "topics"("id")
      ON DELETE SET NULL
    `);

    // Populate the column with the first associated topic (if any)
    await queryRunner.query(`
      WITH ranked_topics AS (
        SELECT
          st."session_id",
          st."topic_id",
          ROW_NUMBER() OVER (PARTITION BY st."session_id" ORDER BY st."created_at") AS rn
        FROM "session_topics" st
      )
      UPDATE "sessions" s
      SET "topic_id" = rt."topic_id"
      FROM ranked_topics rt
      WHERE s."id" = rt."session_id"
        AND rt.rn = 1
    `);
  }
}
