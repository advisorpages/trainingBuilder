import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAudiencesAndTonesTable1738799900000 implements MigrationInterface {
  name = 'CreateAudiencesAndTonesTable1738799900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create audiences table
    await queryRunner.query(`
      CREATE TABLE "audiences" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(100) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create tones table
    await queryRunner.query(`
      CREATE TABLE "tones" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(100) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Add indexes
    await queryRunner.query(`CREATE INDEX "idx_audiences_is_active" ON "audiences" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "idx_tones_is_active" ON "tones" ("is_active")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tones_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audiences_is_active"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audiences"`);
  }
}
