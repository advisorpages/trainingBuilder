import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVariantCacheHitToAIInteractionType1739200000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'variant_cache_hit' to ai_interaction_type_enum
    // Note: PostgreSQL's ALTER TYPE ADD VALUE cannot run inside a transaction block
    // so we need to check if the value already exists first
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'variant_cache_hit'
          AND enumtypid = (
            SELECT oid
            FROM pg_type
            WHERE typname = 'ai_interaction_type_enum'
          )
        ) THEN
          ALTER TYPE ai_interaction_type_enum ADD VALUE 'variant_cache_hit';
        END IF;
      END
      $$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values directly
    // Reverting would require:
    // 1. Creating a new enum without the value
    // 2. Converting all columns to the new enum
    // 3. Dropping the old enum
    // 4. Renaming the new enum
    // This is complex and rarely needed, so we leave it unimplemented
    throw new Error(
      'Cannot revert adding enum value in PostgreSQL. ' +
      'If you need to remove this value, you must manually recreate the enum type.'
    );
  }
}