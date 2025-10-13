import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddCategoryIdToTopics1729800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add category_id column to topics table
    await queryRunner.addColumn(
      'topics',
      new TableColumn({
        name: 'category_id',
        type: 'integer',
        isNullable: true,
      })
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'topics',
      new TableForeignKey({
        name: 'fk_topics_category',
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'SET NULL',
      })
    );

    // Add index for better query performance
    await queryRunner.createIndex(
      'topics',
      new TableIndex({
        name: 'idx_topics_category_id',
        columnNames: ['category_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex('topics', 'idx_topics_category_id');

    // Drop foreign key
    await queryRunner.dropForeignKey('topics', 'fk_topics_category');

    // Drop column
    await queryRunner.dropColumn('topics', 'category_id');
  }
}
