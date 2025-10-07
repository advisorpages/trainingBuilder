import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceLocationsTable1738820000000 implements MigrationInterface {
  name = 'EnhanceLocationsTable1738820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create location_type enum
    await queryRunner.query(`
      CREATE TYPE "location_type_enum" AS ENUM ('physical', 'virtual', 'hybrid')
    `);

    // Create meeting_platform enum
    await queryRunner.query(`
      CREATE TYPE "meeting_platform_enum" AS ENUM ('zoom', 'microsoft_teams', 'google_meet', 'other')
    `);

    // Create locations table with all fields
    await queryRunner.query(`
      CREATE TABLE "locations" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(100) NOT NULL,
        "description" text,
        "location_type" "location_type_enum" NOT NULL DEFAULT 'physical',

        -- Physical location fields
        "address" text,
        "city" varchar(100),
        "state" varchar(100),
        "country" varchar(100),
        "postal_code" varchar(20),
        "capacity" integer,

        -- Virtual meeting fields
        "meeting_platform" "meeting_platform_enum",
        "meeting_link" varchar(500),
        "meeting_id" varchar(255),
        "meeting_password" varchar(255),
        "dial_in_number" varchar(100),

        -- Common fields
        "timezone" varchar(100),
        "access_instructions" text,
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Add foreign key constraint from sessions to locations
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD CONSTRAINT "FK_sessions_location"
      FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP CONSTRAINT IF EXISTS "FK_sessions_location"
    `);

    // Drop locations table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "locations"
    `);

    // Drop enums
    await queryRunner.query(`
      DROP TYPE IF EXISTS "meeting_platform_enum"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "location_type_enum"
    `);
  }
}
