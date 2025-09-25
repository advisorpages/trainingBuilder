import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMarketingKitToSessions1727115200000 implements MigrationInterface {
  name = 'AddMarketingKitToSessions1727115200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('sessions', new TableColumn({
      name: 'marketing_kit_content',
      type: 'text',
      isNullable: true,
      comment: 'Generated marketing kit content for session promotion'
    }));

    await queryRunner.addColumn('sessions', new TableColumn({
      name: 'session_outline_data',
      type: 'jsonb',
      isNullable: true,
      comment: 'Generated session outline data from session builder'
    }));

    await queryRunner.addColumn('sessions', new TableColumn({
      name: 'builder_generated',
      type: 'boolean',
      default: false,
      comment: 'Indicates if session was created using the session builder'
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('sessions', 'marketing_kit_content');
    await queryRunner.dropColumn('sessions', 'session_outline_data');
    await queryRunner.dropColumn('sessions', 'builder_generated');
  }
}