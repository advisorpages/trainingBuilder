import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionTopicTrainersTable1739100000000 implements MigrationInterface {
  name = 'CreateSessionTopicTrainersTable1739100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the session_topic_trainers junction table for many-to-many relationship
    await queryRunner.query(`
      CREATE TABLE "session_topic_trainers" (
        "session_id" uuid NOT NULL,
        "topic_id" integer NOT NULL,
        "trainer_id" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("session_id", "topic_id", "trainer_id"),
        CONSTRAINT "fk_session_topic_trainers_session"
          FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_session_topic_trainers_topic"
          FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_session_topic_trainers_trainer"
          FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "idx_session_topic_trainers_session_id"
      ON "session_topic_trainers" ("session_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_session_topic_trainers_topic_id"
      ON "session_topic_trainers" ("topic_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_session_topic_trainers_trainer_id"
      ON "session_topic_trainers" ("trainer_id")
    `);

    // Migrate existing single trainer assignments from session_topics to the new table
    await queryRunner.query(`
      INSERT INTO "session_topic_trainers" (session_id, topic_id, trainer_id)
      SELECT session_id, topic_id, trainer_id
      FROM "session_topics"
      WHERE trainer_id IS NOT NULL
      ON CONFLICT (session_id, topic_id, trainer_id) DO NOTHING
    `);

    // Note: We keep the trainer_id column in session_topics for backward compatibility
    // It can be removed in a future migration once we're sure everything works
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_session_topic_trainers_trainer_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_session_topic_trainers_topic_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_session_topic_trainers_session_id"`);

    // Drop the junction table
    await queryRunner.query(`DROP TABLE IF EXISTS "session_topic_trainers"`);
  }
}