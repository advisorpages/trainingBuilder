import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePromptsTable1735766400000 implements MigrationInterface {
  name = 'CreatePromptsTable1735766400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum for prompt categories
    await queryRunner.query(`
      CREATE TYPE "prompt_category_enum" AS ENUM (
        'session_generation',
        'title_creation',
        'content_enhancement',
        'marketing_kit',
        'training_kit',
        'validation'
      )
    `);

    // Create prompts table
    await queryRunner.query(`
      CREATE TABLE "prompts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "category" "prompt_category_enum" NOT NULL,
        "template" text NOT NULL,
        "description" text,
        "variables" jsonb NOT NULL DEFAULT '[]',
        "is_active" boolean NOT NULL DEFAULT true,
        "version" integer NOT NULL DEFAULT 1,
        "example_input" text,
        "expected_output" text,
        "metadata" jsonb,
        CONSTRAINT "UQ_prompts_name" UNIQUE ("name"),
        CONSTRAINT "PK_prompts" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_prompts_category_is_active" ON "prompts" ("category", "is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_prompts_name_is_active" ON "prompts" ("name", "is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_prompts_name_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_prompts_category_is_active"`);
    await queryRunner.query(`DROP TABLE "prompts"`);
    await queryRunner.query(`DROP TYPE "prompt_category_enum"`);
  }
}