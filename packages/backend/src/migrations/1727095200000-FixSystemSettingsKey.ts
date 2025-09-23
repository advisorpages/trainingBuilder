import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSystemSettingsKey1727095200000 implements MigrationInterface {
  name = 'FixSystemSettingsKey1727095200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure uuid extension for generating fallback keys
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Replace NULL keys with generated placeholders so NOT NULL/PK constraints can hold
    await queryRunner.query(`
      UPDATE system_settings
      SET key = 'legacy_' || uuid_generate_v4()
      WHERE key IS NULL;
    `);

    // Ensure column type and NOT NULL match application expectations
    await queryRunner.query(`
      ALTER TABLE system_settings
      ALTER COLUMN key TYPE VARCHAR(100),
      ALTER COLUMN key SET NOT NULL;
    `);

    // Ensure primary key exists on key (no-op if already present)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'system_settings'::regclass AND contype = 'p'
        ) THEN
          ALTER TABLE system_settings ADD PRIMARY KEY (key);
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: we won't revert data repairs or constraints
  }
}

