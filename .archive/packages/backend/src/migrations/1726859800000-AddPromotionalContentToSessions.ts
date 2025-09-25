import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPromotionalContentToSessions1726859800000 implements MigrationInterface {
    name = 'AddPromotionalContentToSessions1726859800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "sessions"
            ADD COLUMN "promotional_headline" text,
            ADD COLUMN "promotional_summary" text,
            ADD COLUMN "key_benefits" text,
            ADD COLUMN "call_to_action" text,
            ADD COLUMN "social_media_content" text,
            ADD COLUMN "email_marketing_content" text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "sessions"
            DROP COLUMN "promotional_headline",
            DROP COLUMN "promotional_summary",
            DROP COLUMN "key_benefits",
            DROP COLUMN "call_to_action",
            DROP COLUMN "social_media_content",
            DROP COLUMN "email_marketing_content"
        `);
    }
}