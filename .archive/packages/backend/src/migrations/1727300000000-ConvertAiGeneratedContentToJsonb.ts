import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertAiGeneratedContentToJsonb1727300000000 implements MigrationInterface {
  name = 'ConvertAiGeneratedContentToJsonb1727300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check current data type of ai_generated_content
    const result: Array<{ data_type: string }> = await queryRunner.query(
      `
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'ai_generated_content'
      `
    );

    if (!result || result.length === 0) {
      // Column doesn't exist; nothing to do
      return;
    }

    const currentType = result[0].data_type;

    // If the column is already json or jsonb, skip
    if (currentType === 'json' || currentType === 'jsonb') {
      return;
    }

    // Convert TEXT to JSONB safely:
    // - If the existing text starts with '{' or '[', try to cast to jsonb
    // - Otherwise wrap it in an object {"legacyText": <text>}
    await queryRunner.query(`
      ALTER TABLE sessions
      ALTER COLUMN ai_generated_content
      TYPE jsonb
      USING (
        CASE
          WHEN ai_generated_content IS NULL THEN NULL
          WHEN trim(ai_generated_content) LIKE '{%' OR trim(ai_generated_content) LIKE '[%'
            THEN ai_generated_content::jsonb
          ELSE jsonb_build_object('legacyText', ai_generated_content)
        END
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to TEXT, storing the JSON as its string representation
    const result: Array<{ data_type: string }> = await queryRunner.query(
      `
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'ai_generated_content'
      `
    );

    if (!result || result.length === 0) {
      return;
    }

    const currentType = result[0].data_type;
    if (currentType !== 'json' && currentType !== 'jsonb') {
      return; // already text or other
    }

    await queryRunner.query(`
      ALTER TABLE sessions
      ALTER COLUMN ai_generated_content
      TYPE text
      USING (
        CASE
          WHEN ai_generated_content IS NULL THEN NULL
          ELSE ai_generated_content::text
        END
      )
    `);
  }
}

