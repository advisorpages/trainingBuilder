import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddSessionCoachingTips1726790000000 implements MigrationInterface {
  name = 'AddSessionCoachingTips1726790000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create session_coaching_tips table
    await queryRunner.createTable(
      new Table({
        name: 'session_coaching_tips',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'session_id',
            type: 'uuid',
          },
          {
            name: 'coaching_tip_id',
            type: 'integer',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'generated'",
          },
          {
            name: 'created_by_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['session_id'],
            referencedTableName: 'sessions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['coaching_tip_id'],
            referencedTableName: 'coaching_tips',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['created_by_user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
    );

    // Add indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_session_coaching_tips_session_id" ON "session_coaching_tips" ("session_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_session_coaching_tips_coaching_tip_id" ON "session_coaching_tips" ("coaching_tip_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_session_coaching_tips_status" ON "session_coaching_tips" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_session_coaching_tips_is_active" ON "session_coaching_tips" ("is_active");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_session_coaching_tips_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_session_coaching_tips_status"`);
    await queryRunner.query(`DROP INDEX "IDX_session_coaching_tips_coaching_tip_id"`);
    await queryRunner.query(`DROP INDEX "IDX_session_coaching_tips_session_id"`);

    // Drop session_coaching_tips table
    await queryRunner.dropTable('session_coaching_tips');
  }
}