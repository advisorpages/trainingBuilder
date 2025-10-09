import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiPromptSettingsTable1738911000000 implements MigrationInterface {
  name = 'CreateAiPromptSettingsTable1738911000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_prompt_settings (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        category varchar(80) NOT NULL,
        label varchar(120) NOT NULL,
        slug varchar(140) NOT NULL,
        description text,
        settings jsonb NOT NULL DEFAULT '{}'::jsonb,
        is_current boolean NOT NULL DEFAULT false,
        is_pinned boolean NOT NULL DEFAULT false,
        is_archived boolean NOT NULL DEFAULT false,
        created_by varchar(120),
        notes text,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ai_prompt_settings_slug_idx
      ON ai_prompt_settings (slug)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS ai_prompt_settings_category_current_idx
      ON ai_prompt_settings (category, is_current)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS ai_prompt_settings_category_pinned_idx
      ON ai_prompt_settings (category, is_pinned)
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW ai_interaction_snapshots AS
      SELECT
        ai.id,
        ai.created_at,
        ai.updated_at,
        ai.status,
        ai.interaction_type,
        ai.session_id,
        ai.user_id,
        ai.tokens_used,
        ai.processing_time_ms,
        ai.model_used,
        ai.prompt_version,
        ai.input_variables,
        ai.structured_output,
        (ai.metadata -> 'configSnapshot')::jsonb AS config_snapshot,
        (ai.metadata -> 'configSnapshot' -> 'overrides')::jsonb AS overrides_snapshot,
        (ai.metadata -> 'configSnapshot' ->> 'variantLabel') AS variant_label,
        (ai.metadata -> 'configSnapshot' ->> 'variantDescription') AS variant_description,
        (ai.metadata -> 'configSnapshot' ->> 'ragMode') AS rag_mode,
        COALESCE(
          NULLIF((ai.metadata -> 'configSnapshot' ->> 'ragWeight'), '')::numeric,
          0
        ) AS rag_weight,
        COALESCE(
          NULLIF((ai.metadata -> 'configSnapshot' ->> 'durationTarget'), '')::numeric,
          NULLIF((ai.input_variables ->> 'duration'), '')::numeric,
          0
        ) AS duration_target,
        COALESCE(
          NULLIF((ai.metadata -> 'metrics' ->> 'durationActual'), '')::numeric,
          NULLIF((ai.structured_output ->> 'totalDuration'), '')::numeric,
          0
        ) AS duration_actual,
        COALESCE(
          (ai.metadata -> 'metrics' ->> 'sectionCount')::int,
          CASE
            WHEN ai.structured_output -> 'sections' IS NOT NULL
              THEN jsonb_array_length(ai.structured_output -> 'sections')
            ELSE 0
          END,
          0
        ) AS section_count,
        COALESCE(
          (ai.metadata -> 'metrics' ->> 'ragSources')::int,
          (ai.metadata -> 'ragSummary' ->> 'ragSources')::int,
          0
        ) AS rag_sources,
        (ai.metadata -> 'userNotes')::jsonb AS user_notes,
        ai.metadata
      FROM ai_interactions ai
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS ai_interaction_snapshots`);
    await queryRunner.query(`DROP INDEX IF EXISTS ai_prompt_settings_category_pinned_idx`);
    await queryRunner.query(`DROP INDEX IF EXISTS ai_prompt_settings_category_current_idx`);
    await queryRunner.query(`DROP INDEX IF EXISTS ai_prompt_settings_slug_idx`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_prompt_settings`);
  }
}
