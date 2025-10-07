import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAIInteractionsTable1738840000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE ai_interaction_type_enum AS ENUM (
        'outline_generation',
        'title_generation',
        'content_enhancement',
        'training_kit',
        'marketing_kit'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE ai_interaction_status_enum AS ENUM (
        'success',
        'failure',
        'partial'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE user_feedback_enum AS ENUM (
        'accepted',
        'rejected',
        'modified',
        'no_feedback'
      )
    `);

    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'ai_interactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'session_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'prompt_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'interaction_type',
            type: 'ai_interaction_type_enum',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'ai_interaction_status_enum',
            isNullable: false,
          },
          {
            name: 'rendered_prompt',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'input_variables',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'ai_response',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'structured_output',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'processing_time_ms',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'tokens_used',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'estimated_cost',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'model_used',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'prompt_version',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'user_feedback',
            type: 'user_feedback_enum',
            default: "'no_feedback'",
            isNullable: false,
          },
          {
            name: 'user_feedback_comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'feedback_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'quality_score',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'edit_distance',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'audience_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'tone_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'session_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'all_variables_present',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'missing_variables',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'ai_interactions',
      new TableForeignKey({
        columnNames: ['session_id'],
        referencedTableName: 'sessions',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'ai_interactions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'ai_interactions',
      new TableForeignKey({
        columnNames: ['prompt_id'],
        referencedTableName: 'prompts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'ai_interactions',
      new TableForeignKey({
        columnNames: ['audience_id'],
        referencedTableName: 'audiences',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'ai_interactions',
      new TableForeignKey({
        columnNames: ['tone_id'],
        referencedTableName: 'tones',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    // Create indexes
    await queryRunner.createIndex(
      'ai_interactions',
      new TableIndex({
        name: 'idx_ai_interactions_session_created',
        columnNames: ['session_id', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'ai_interactions',
      new TableIndex({
        name: 'idx_ai_interactions_type_status',
        columnNames: ['interaction_type', 'status'],
      })
    );

    await queryRunner.createIndex(
      'ai_interactions',
      new TableIndex({
        name: 'idx_ai_interactions_created_at',
        columnNames: ['created_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table (foreign keys will be dropped automatically)
    await queryRunner.dropTable('ai_interactions');

    // Drop enums
    await queryRunner.query('DROP TYPE IF EXISTS user_feedback_enum');
    await queryRunner.query('DROP TYPE IF EXISTS ai_interaction_status_enum');
    await queryRunner.query('DROP TYPE IF EXISTS ai_interaction_type_enum');
  }
}
