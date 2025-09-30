import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionLocationFields1706000000000 implements MigrationInterface {
  name = 'AddSessionLocationFields1706000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "location_id" integer');
    await queryRunner.query('ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "audience_id" integer');
    await queryRunner.query('ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "tone_id" integer');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "sessions" DROP COLUMN IF EXISTS "tone_id"');
    await queryRunner.query('ALTER TABLE "sessions" DROP COLUMN IF EXISTS "audience_id"');
    await queryRunner.query('ALTER TABLE "sessions" DROP COLUMN IF EXISTS "location_id"');
  }
}
