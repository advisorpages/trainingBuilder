import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1726526400000 implements MigrationInterface {
    name = 'InitialSchema1726526400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // This migration represents the initial schema state
        // The actual tables are created by SQL scripts in database/init/
        // This migration serves as a baseline for future changes

        await queryRunner.query(`
            -- Record schema version
            INSERT INTO system_settings (key, value, description) VALUES
                ('migration_version', '1726526400000', 'Initial schema migration')
            ON CONFLICT (key) DO UPDATE SET
                value = EXCLUDED.value,
                updated_at = CURRENT_TIMESTAMP;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove migration version record
        await queryRunner.query(`
            DELETE FROM system_settings WHERE key = 'migration_version';
        `);
    }
}