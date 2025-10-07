import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceTonesTable1738800100000 implements MigrationInterface {
  name = 'EnhanceTonesTable1738800100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add tone style enum type
    await queryRunner.query(`
      CREATE TYPE "tone_style_enum" AS ENUM (
        'professional',
        'casual',
        'motivational',
        'authoritative',
        'empowering',
        'collaborative',
        'directive'
      )
    `);

    // Add energy level enum type
    await queryRunner.query(`
      CREATE TYPE "tone_energy_level_enum" AS ENUM (
        'calm',
        'moderate',
        'energetic',
        'passionate'
      )
    `);

    // Add sentence structure enum type
    await queryRunner.query(`
      CREATE TYPE "tone_sentence_structure_enum" AS ENUM (
        'simple',
        'moderate',
        'complex',
        'varied'
      )
    `);

    // Add new columns to tones table
    await queryRunner.query(`
      ALTER TABLE "tones"
      ADD COLUMN "style" "tone_style_enum" DEFAULT 'professional',
      ADD COLUMN "formality" integer DEFAULT 3 CHECK (formality >= 1 AND formality <= 5),
      ADD COLUMN "energy_level" "tone_energy_level_enum" DEFAULT 'moderate',
      ADD COLUMN "language_characteristics" jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN "sentence_structure" "tone_sentence_structure_enum" DEFAULT 'varied',
      ADD COLUMN "emotional_resonance" jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN "example_phrases" jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN "prompt_instructions" text
    `);

    // Add comments for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "tones"."style" IS 'Overall tone style for content delivery';
      COMMENT ON COLUMN "tones"."formality" IS 'Formality level on scale 1-5, where 1=very casual, 5=very formal';
      COMMENT ON COLUMN "tones"."energy_level" IS 'Energy and enthusiasm level in delivery';
      COMMENT ON COLUMN "tones"."language_characteristics" IS 'Array of language traits (e.g., ["active-voice", "direct", "inclusive", "action-oriented"])';
      COMMENT ON COLUMN "tones"."sentence_structure" IS 'Preferred sentence complexity and structure';
      COMMENT ON COLUMN "tones"."emotional_resonance" IS 'Array of emotional qualities (e.g., ["empathy", "confidence", "urgency", "warmth"])';
      COMMENT ON COLUMN "tones"."example_phrases" IS 'Array of sample sentences that exemplify this tone';
      COMMENT ON COLUMN "tones"."prompt_instructions" IS 'Direct instructions to AI for applying this tone to content';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "tones"
      DROP COLUMN IF EXISTS "prompt_instructions",
      DROP COLUMN IF EXISTS "example_phrases",
      DROP COLUMN IF EXISTS "emotional_resonance",
      DROP COLUMN IF EXISTS "sentence_structure",
      DROP COLUMN IF EXISTS "language_characteristics",
      DROP COLUMN IF EXISTS "energy_level",
      DROP COLUMN IF EXISTS "formality",
      DROP COLUMN IF EXISTS "style"
    `);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "tone_sentence_structure_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tone_energy_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tone_style_enum"`);
  }
}
