import { MigrationInterface, QueryRunner, TableColumn, Table, Index } from 'typeorm';

export class AddPublishingLogicToSessions1726789800000 implements MigrationInterface {
  name = 'AddPublishingLogicToSessions1726789800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to sessions table for publishing logic
    await queryRunner.addColumns('sessions', [
      new TableColumn({
        name: 'status_changed_at',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'status_changed_by',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'automated_status_change',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'content_validation_status',
        type: 'varchar',
        length: '20',
        default: "'pending'",
      }),
      new TableColumn({
        name: 'content_validation_errors',
        type: 'json',
        isNullable: true,
      }),
      new TableColumn({
        name: 'publication_requirements_met',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'last_validation_check',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);

    // Create session_status_history table
    await queryRunner.createTable(
      new Table({
        name: 'session_status_history',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'session_id',
            type: 'uuid',
          },
          {
            name: 'old_status',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'new_status',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'changed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'automated_change',
            type: 'boolean',
            default: false,
          },
          {
            name: 'change_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
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
            columnNames: ['changed_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
    );

    // Add indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_session_status_history_session_id" ON "session_status_history" ("session_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_session_status_history_created_at" ON "session_status_history" ("created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_status_changed_at" ON "sessions" ("status_changed_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_content_validation_status" ON "sessions" ("content_validation_status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_sessions_content_validation_status"`);
    await queryRunner.query(`DROP INDEX "IDX_sessions_status_changed_at"`);
    await queryRunner.query(`DROP INDEX "IDX_session_status_history_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_session_status_history_session_id"`);

    // Drop session_status_history table
    await queryRunner.dropTable('session_status_history');

    // Remove columns from sessions table
    await queryRunner.dropColumns('sessions', [
      'status_changed_at',
      'status_changed_by',
      'automated_status_change',
      'content_validation_status',
      'content_validation_errors',
      'publication_requirements_met',
      'last_validation_check',
    ]);
  }
}