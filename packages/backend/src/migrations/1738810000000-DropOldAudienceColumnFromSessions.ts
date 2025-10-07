import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropOldAudienceColumnFromSessions1738810000000 implements MigrationInterface {
  name = 'DropOldAudienceColumnFromSessions1738810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old audience text column from sessions table
    // This column has been replaced by audience_id foreign key
    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP COLUMN IF EXISTS "audience"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the old audience text column if migration is rolled back
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "audience" text
    `);
  }
}
