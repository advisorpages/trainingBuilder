import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable1735766500000 implements MigrationInterface {
  name = 'CreateCategoriesTable1735766500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create categories table
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name"),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_categories_is_active" ON "categories" ("is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_categories_name" ON "categories" ("name")
    `);

    // Add category_id column to sessions table if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "category_id" integer
    `);

    // Add foreign key constraint to sessions table for category_id
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD CONSTRAINT "FK_sessions_category"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint from sessions
    await queryRunner.query(`
      ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_category"
    `);

    // Remove category_id column from sessions
    await queryRunner.query(`
      ALTER TABLE "sessions" DROP COLUMN "category_id"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_categories_name"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_is_active"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}