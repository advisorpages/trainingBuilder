import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTrainersIdToInteger1738830000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if trainer_assignments table exists
    const hasTrainerAssignments = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'trainer_assignments'
      );
    `);

    if (hasTrainerAssignments[0].exists) {
      // Drop the foreign key constraint from trainer_assignments
      await queryRunner.query(`
        ALTER TABLE trainer_assignments
        DROP CONSTRAINT IF EXISTS fk_trainer_assignments_trainer;
      `);
    }

    // Drop the old trainers table and recreate with integer ID
    await queryRunner.query(`DROP TABLE IF EXISTS trainers CASCADE;`);

    // Create trainers table with integer ID
    await queryRunner.query(`
      CREATE TABLE trainers (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        bio TEXT,
        email VARCHAR UNIQUE NOT NULL,
        phone VARCHAR,
        expertise_tags TEXT,
        timezone VARCHAR,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);

    // Update trainer_assignments table to use integer trainer_id
    if (hasTrainerAssignments[0].exists) {
      // Change trainer_id column type to integer
      await queryRunner.query(`
        ALTER TABLE trainer_assignments
        ALTER COLUMN trainer_id TYPE INTEGER USING NULL;
      `);

      // Recreate the foreign key constraint
      await queryRunner.query(`
        ALTER TABLE trainer_assignments
        ADD CONSTRAINT fk_trainer_assignments_trainer
        FOREIGN KEY (trainer_id)
        REFERENCES trainers(id)
        ON DELETE CASCADE;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if trainer_assignments table exists
    const hasTrainerAssignments = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'trainer_assignments'
      );
    `);

    if (hasTrainerAssignments[0].exists) {
      // Drop the foreign key constraint
      await queryRunner.query(`
        ALTER TABLE trainer_assignments
        DROP CONSTRAINT IF EXISTS fk_trainer_assignments_trainer;
      `);
    }

    // Drop and recreate with UUID
    await queryRunner.query(`DROP TABLE IF EXISTS trainers CASCADE;`);

    await queryRunner.query(`
      CREATE TABLE trainers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR NOT NULL,
        bio TEXT,
        email VARCHAR UNIQUE NOT NULL,
        phone VARCHAR,
        expertise_tags TEXT,
        timezone VARCHAR,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);

    // Update trainer_assignments back to UUID
    if (hasTrainerAssignments[0].exists) {
      // Change trainer_id column type back to UUID
      await queryRunner.query(`
        ALTER TABLE trainer_assignments
        ALTER COLUMN trainer_id TYPE UUID USING NULL;
      `);

      // Recreate foreign key
      await queryRunner.query(`
        ALTER TABLE trainer_assignments
        ADD CONSTRAINT fk_trainer_assignments_trainer
        FOREIGN KEY (trainer_id)
        REFERENCES trainers(id)
        ON DELETE CASCADE;
      `);
    }
  }
}
