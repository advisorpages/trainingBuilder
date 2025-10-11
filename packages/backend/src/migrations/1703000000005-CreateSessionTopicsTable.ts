import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionTopicsTable1703000000005 implements MigrationInterface {
  name = 'CreateSessionTopicsTable1703000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the session_topics join table for many-to-many relationship
    await queryRunner.query(`
      CREATE TABLE "session_topics" (
        "session_id" uuid NOT NULL,
        "topic_id" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("session_id", "topic_id"),
        CONSTRAINT "fk_session_topics_session" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_session_topics_topic" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE
      )
    `);

    // Create index for better query performance
    await queryRunner.query(`
      CREATE INDEX "idx_session_topics_topic_id" ON "session_topics" ("topic_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_session_topics_topic_id"');
    await queryRunner.query('DROP TABLE IF EXISTS "session_topics"');
  }
}