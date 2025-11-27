import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePersonalizedNamesTable1739808100000 implements MigrationInterface {
    name = 'CreatePersonalizedNamesTable1739808100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for personalized name types
        await queryRunner.query(`
            CREATE TYPE "personalized_name_type_enum" AS ENUM(
                'husband',
                'wife',
                'partner',
                'child',
                'parent',
                'sibling',
                'friend',
                'colleague',
                'other'
            )
        `);

        // Create personalized_names table
        await queryRunner.query(`
            CREATE TABLE "personalized_names" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "type" "personalized_name_type_enum" NOT NULL,
                "custom_label" character varying(50),
                "name" character varying(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_personalized_names" PRIMARY KEY ("id")
            )
        `);

        // Create index on user_id for faster lookups
        await queryRunner.query(`
            CREATE INDEX "IDX_personalized_names_user_id" ON "personalized_names" ("user_id")
        `);

        // Create index on type for faster type-based lookups
        await queryRunner.query(`
            CREATE INDEX "IDX_personalized_names_type" ON "personalized_names" ("type")
        `);

        // Add foreign key constraint to users table
        await queryRunner.query(`
            ALTER TABLE "personalized_names"
            ADD CONSTRAINT "FK_personalized_names_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "personalized_names"
            DROP CONSTRAINT "FK_personalized_names_user_id"
        `);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_personalized_names_type"`);
        await queryRunner.query(`DROP INDEX "IDX_personalized_names_user_id"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "personalized_names"`);

        // Drop enum type
        await queryRunner.query(`DROP TYPE "personalized_name_type_enum"`);
    }
}