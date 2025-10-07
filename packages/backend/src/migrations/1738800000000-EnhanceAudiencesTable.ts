import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceAudiencesTable1738800000000 implements MigrationInterface {
  name = 'EnhanceAudiencesTable1738800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add experience level enum type
    await queryRunner.query(`
      CREATE TYPE "audience_experience_level_enum" AS ENUM (
        'beginner',
        'intermediate',
        'advanced',
        'mixed'
      )
    `);

    // Add communication style enum type
    await queryRunner.query(`
      CREATE TYPE "audience_communication_style_enum" AS ENUM (
        'formal',
        'conversational',
        'technical',
        'simplified'
      )
    `);

    // Add vocabulary level enum type
    await queryRunner.query(`
      CREATE TYPE "audience_vocabulary_level_enum" AS ENUM (
        'basic',
        'professional',
        'expert',
        'industry_specific'
      )
    `);

    // Add new columns to audiences table
    await queryRunner.query(`
      ALTER TABLE "audiences"
      ADD COLUMN "experience_level" "audience_experience_level_enum" DEFAULT 'intermediate',
      ADD COLUMN "technical_depth" integer DEFAULT 3 CHECK (technical_depth >= 1 AND technical_depth <= 5),
      ADD COLUMN "preferred_learning_style" text,
      ADD COLUMN "communication_style" "audience_communication_style_enum" DEFAULT 'conversational',
      ADD COLUMN "example_types" jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN "avoid_topics" jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN "vocabulary_level" "audience_vocabulary_level_enum" DEFAULT 'professional',
      ADD COLUMN "prompt_instructions" text
    `);

    // Add comments for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "audiences"."experience_level" IS 'Target experience level of the audience';
      COMMENT ON COLUMN "audiences"."technical_depth" IS 'Technical depth on scale 1-5, where 1=no technical background, 5=highly technical';
      COMMENT ON COLUMN "audiences"."preferred_learning_style" IS 'Preferred learning approach: visual, hands-on, theoretical, discussion-based';
      COMMENT ON COLUMN "audiences"."communication_style" IS 'Preferred communication approach';
      COMMENT ON COLUMN "audiences"."example_types" IS 'Array of relevant example contexts (e.g., ["retail", "healthcare", "remote-teams"])';
      COMMENT ON COLUMN "audiences"."avoid_topics" IS 'Array of sensitive or irrelevant topics to avoid';
      COMMENT ON COLUMN "audiences"."vocabulary_level" IS 'Appropriate vocabulary complexity level';
      COMMENT ON COLUMN "audiences"."prompt_instructions" IS 'Direct instructions to AI for tailoring content to this audience';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "audiences"
      DROP COLUMN IF EXISTS "prompt_instructions",
      DROP COLUMN IF EXISTS "vocabulary_level",
      DROP COLUMN IF EXISTS "avoid_topics",
      DROP COLUMN IF EXISTS "example_types",
      DROP COLUMN IF EXISTS "communication_style",
      DROP COLUMN IF EXISTS "preferred_learning_style",
      DROP COLUMN IF EXISTS "technical_depth",
      DROP COLUMN IF EXISTS "experience_level"
    `);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "audience_vocabulary_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "audience_communication_style_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "audience_experience_level_enum"`);
  }
}
