import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

interface ColumnConfig {
  name: string;
  type: string;
  indexName?: string;
  comment?: string;
}

export class AddAIFieldsToTopics1727500000000 implements MigrationInterface {
  name = 'AddAIFieldsToTopics1727500000000';

  private readonly textColumns: ColumnConfig[] = [
    {
      name: 'learning_outcomes',
      type: 'text',
      indexName: 'idx_topics_learning_outcomes',
      comment: 'Extracted learning outcomes for easy access and queries'
    },
    {
      name: 'trainer_notes',
      type: 'text',
      indexName: 'idx_topics_trainer_notes',
      comment: 'Extracted trainer preparation and delivery notes'
    },
    {
      name: 'materials_needed',
      type: 'text',
      comment: 'Extracted list of required materials and resources'
    },
    {
      name: 'delivery_guidance',
      type: 'text',
      comment: 'Extracted delivery format and timing guidance'
    }
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasAiGeneratedContent = await queryRunner.hasColumn('topics', 'ai_generated_content');

    if (!hasAiGeneratedContent) {
      await queryRunner.addColumn(
        'topics',
        new TableColumn({
          name: 'ai_generated_content',
          type: 'jsonb',
          isNullable: true,
        })
      );

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_topics_ai_content
        ON topics USING GIN (ai_generated_content)
      `);

      await queryRunner.query(`
        COMMENT ON COLUMN topics.ai_generated_content IS 'Stores full AI enhancement data including context, metadata, and structured content'
      `);
    }

    for (const column of this.textColumns) {
      const hasColumn = await queryRunner.hasColumn('topics', column.name);

      if (!hasColumn) {
        await queryRunner.addColumn(
          'topics',
          new TableColumn({
            name: column.name,
            type: column.type,
            isNullable: true,
          })
        );

        if (column.indexName) {
          await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS ${column.indexName}
            ON topics (${column.name})
          `);
        }

        if (column.comment) {
          await queryRunner.query(`
            COMMENT ON COLUMN topics.${column.name} IS '${column.comment}'
          `);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasAiGeneratedContent = await queryRunner.hasColumn('topics', 'ai_generated_content');

    if (hasAiGeneratedContent) {
      await queryRunner.query('DROP INDEX IF EXISTS idx_topics_ai_content');
      await queryRunner.dropColumn('topics', 'ai_generated_content');
    }

    for (const column of this.textColumns) {
      const hasColumn = await queryRunner.hasColumn('topics', column.name);

      if (hasColumn) {
        if (column.indexName) {
          await queryRunner.query(`DROP INDEX IF EXISTS ${column.indexName}`);
        }
        await queryRunner.dropColumn('topics', column.name);
      }
    }
  }
}
