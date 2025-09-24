import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTrainingKitToSessions1727204400000 implements MigrationInterface {
  name = 'AddTrainingKitToSessions1727204400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('sessions', new TableColumn({
      name: 'training_kit_content',
      type: 'text',
      isNullable: true,
      comment: 'Generated training kit content for trainers'
    }));

    await queryRunner.addColumn('sessions', new TableColumn({
      name: 'builder_completion_status',
      type: 'jsonb',
      isNullable: true,
      comment: 'Session builder completion tracking data'
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('sessions', 'training_kit_content');
    await queryRunner.dropColumn('sessions', 'builder_completion_status');
  }
}