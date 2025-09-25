import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIsActiveColumn1701000000001 implements MigrationInterface {
  name = 'AddUserIsActiveColumn1701000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "is_active" = true
      WHERE "is_active" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "is_active"
    `);
  }
}
