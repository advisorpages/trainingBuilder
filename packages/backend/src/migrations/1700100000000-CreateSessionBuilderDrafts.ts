import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionBuilderDrafts1700100000000 implements MigrationInterface {
  name = 'CreateSessionBuilderDrafts1700100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "session_builder_drafts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "draft_key" varchar NOT NULL UNIQUE,
        "session_id" uuid,
        "payload" jsonb NOT NULL,
        "saved_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_builder_drafts_session" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "session_builder_drafts"');
  }
}

