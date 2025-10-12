import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingSessionColumns1739000000000 implements MigrationInterface {
  name = 'AddMissingSessionColumns1739000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add trainer_id column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "trainer_id" integer
    `);

    // Add foreign key constraint for trainer_id
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_sessions_trainer'
        ) THEN
          ALTER TABLE "sessions"
          ADD CONSTRAINT "fk_sessions_trainer"
          FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Add category_id column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "category_id" integer
    `);

    // Add foreign key constraint for category_id
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_sessions_category'
        ) THEN
          ALTER TABLE "sessions"
          ADD CONSTRAINT "fk_sessions_category"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Add subtitle column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "subtitle" VARCHAR(255)
    `);

    // Add objective column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "objective" TEXT
    `);

    // Add readinessScore column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "readinessScore" integer DEFAULT 0
    `);

    // Add durationMinutes column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "durationMinutes" integer
    `);

    // Add aiPromptContext column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "aiPromptContext" jsonb
    `);

    // Add registrationUrl column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "registrationUrl" TEXT
    `);

    // Add publishedAt column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP WITH TIME ZONE
    `);

    // Create indexes for the new columns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_trainer_id"
      ON "sessions" ("trainer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_category_id"
      ON "sessions" ("category_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_readinessScore"
      ON "sessions" ("readinessScore")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_publishedAt"
      ON "sessions" ("publishedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sessions_publishedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sessions_readinessScore"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sessions_category_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sessions_trainer_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "fk_sessions_category"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "fk_sessions_trainer"`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "publishedAt"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "registrationUrl"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "aiPromptContext"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "durationMinutes"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "readinessScore"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "objective"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "subtitle"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "category_id"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "trainer_id"`);
  }
}