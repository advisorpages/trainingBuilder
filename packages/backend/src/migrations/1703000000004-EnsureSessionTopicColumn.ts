import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureSessionTopicColumn1703000000004 implements MigrationInterface {
  name = 'EnsureSessionTopicColumn1703000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "topic_id" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP CONSTRAINT IF EXISTS "fk_sessions_topic"
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD CONSTRAINT "fk_sessions_topic"
      FOREIGN KEY ("topic_id")
      REFERENCES "topics"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_topic_id"
      ON "sessions" ("topic_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_sessions_topic_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP CONSTRAINT IF EXISTS "fk_sessions_topic"
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP COLUMN IF EXISTS "topic_id"
    `);
  }
}
