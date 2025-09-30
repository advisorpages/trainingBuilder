import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureUserRoleAndDisplayName1701000000002 implements MigrationInterface {
  name = 'EnsureUserRoleAndDisplayName1701000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          CREATE TYPE "user_role_enum" AS ENUM ('broker', 'content_developer', 'trainer');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "display_name" varchar
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "role" "user_role_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_id') THEN
          UPDATE "users"
          SET "role" = CASE "role_id"
            WHEN 1 THEN 'broker'
            WHEN 2 THEN 'content_developer'
            WHEN 3 THEN 'trainer'
            ELSE 'content_developer'
          END
          WHERE "role" IS NULL AND "role_id" IS NOT NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "display_name" = COALESCE("display_name", split_part("email", '@', 1))
      WHERE "display_name" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "is_active" = true
      WHERE "is_active" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "is_active" SET NOT NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'users_role_id_fkey'
        ) THEN
          ALTER TABLE "users" DROP CONSTRAINT "users_role_id_fkey";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_role'
        ) THEN
          DROP INDEX "idx_users_role";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "role_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "roles"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role_id" integer
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(50) NOT NULL UNIQUE,
        "description" text,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);

    await queryRunner.query(`
      UPDATE "users" SET "role_id" = CASE "role"
        WHEN 'broker' THEN 1
        WHEN 'content_developer' THEN 2
        WHEN 'trainer' THEN 3
        ELSE NULL
      END
    `);

    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "role"
    `);

    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "display_name"
    `);

    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "is_active"
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          DROP TYPE "user_role_enum";
        END IF;
      END
      $$;
    `);
  }
}
