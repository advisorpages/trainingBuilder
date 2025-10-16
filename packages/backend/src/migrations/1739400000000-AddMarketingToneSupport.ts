import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketingToneSupport1739400000000 implements MigrationInterface {
  name = 'AddMarketingToneSupport1739400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "tone_usage_type_enum" AS ENUM ('instructional', 'marketing', 'both')
    `);

    await queryRunner.query(`
      ALTER TABLE "tones"
      ADD COLUMN "usage_type" "tone_usage_type_enum" NOT NULL DEFAULT 'instructional'
    `);

    await queryRunner.query(`
      UPDATE "tones"
      SET name = regexp_replace(name, '\\s+', '', 'g')
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN "marketing_tone_id" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD CONSTRAINT "FK_sessions_marketing_tone" FOREIGN KEY ("marketing_tone_id") REFERENCES "tones"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      INSERT INTO "tones" (
        "name",
        "description",
        "usage_type",
        "is_active",
        "style",
        "formality",
        "energy_level",
        "language_characteristics",
        "sentence_structure",
        "emotional_resonance",
        "example_phrases",
        "prompt_instructions",
        "created_at",
        "updated_at"
      )
      SELECT
        'Conversational',
        'Friendly, approachable marketing voice that feels like a trusted colleague.',
        'marketing',
        true,
        'casual',
        2,
        'moderate',
        '["approachable","relatable","clear"]',
        'moderate',
        '["warm","supportive"]',
        '["Let''s build momentum together.","Here''s how you can put this into action."]',
        'Use a warm, relatable voice that feels like a supportive coach speaking to peers.',
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM "tones" WHERE LOWER("name") = LOWER('Conversational')
      )
    `);

    await queryRunner.query(`
      UPDATE "sessions"
      SET "marketing_tone_id" = tone.id
      FROM "tones" tone
      WHERE tone.name = 'Conversational' AND tone.is_active = true AND "sessions"."marketing_tone_id" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "tones"
      WHERE LOWER("name") = LOWER('Conversational')
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP CONSTRAINT IF EXISTS "FK_sessions_marketing_tone"
    `);

    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP COLUMN IF EXISTS "marketing_tone_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "tones"
      DROP COLUMN IF EXISTS "usage_type"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "tone_usage_type_enum"
    `);
  }
}
