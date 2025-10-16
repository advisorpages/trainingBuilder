import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSavedVariantsTable1739300000000 implements MigrationInterface {
  name = 'CreateSavedVariantsTable1739300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create saved_variants table
    await queryRunner.query(`
      CREATE TABLE "saved_variants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "variant_id" character varying(255) NOT NULL,
        "outline" jsonb NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "category_id" integer,
        "session_type" character varying(100),
        "total_duration" integer NOT NULL DEFAULT 0,
        "rag_weight" numeric NOT NULL DEFAULT 0,
        "rag_sources_used" integer NOT NULL DEFAULT 0,
        "rag_sources" jsonb,
        "generation_source" character varying(20) NOT NULL DEFAULT 'ai',
        "variant_label" character varying(255) NOT NULL,
        "metadata" jsonb,
        "is_favorite" boolean NOT NULL DEFAULT false,
        "tags" text array NOT NULL DEFAULT '{}',
        "collection_name" character varying(255),
        "order" integer NOT NULL DEFAULT 0,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "usage_count" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_saved_variants" PRIMARY KEY ("id")
      )
    `);

    // Create foreign key constraint for user_id
    await queryRunner.query(`
      ALTER TABLE "saved_variants" ADD CONSTRAINT "FK_saved_variants_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Create foreign key constraint for category_id
    await queryRunner.query(`
      ALTER TABLE "saved_variants" ADD CONSTRAINT "FK_saved_variants_category_id"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_saved_variants_user_id_created_at" ON "saved_variants" ("user_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_saved_variants_user_id_category_id" ON "saved_variants" ("user_id", "category_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_saved_variants_user_id_is_favorite" ON "saved_variants" ("user_id", "is_favorite")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_saved_variants_collection_name" ON "saved_variants" ("collection_name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_saved_variants_last_used_at" ON "saved_variants" ("last_used_at")
    `);

    // Add comments for documentation
    await queryRunner.query(`
      COMMENT ON TABLE "saved_variants" IS 'User-saved AI-generated session outline variants for future reuse'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "saved_variants"."user_id" IS 'The user who saved this variant'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "saved_variants"."variant_id" IS 'Original variant ID from generation'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "saved_variants"."outline" IS 'The complete session outline data'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "saved_variants"."title" IS 'Display title for the saved variant'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "saved_variants"."rag_sources" IS 'Array of RAG source documents used in generation'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "saved_variants"."generation_source" IS 'rag, baseline, or ai'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "saved_variants"."tags" IS 'User-defined tags for organization'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "saved_variants"."collection_name" IS 'User-defined collection grouping'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "saved_variants"."usage_count" IS 'Track how many times this variant has been used'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_saved_variants_last_used_at"`);
    await queryRunner.query(`DROP INDEX "IDX_saved_variants_collection_name"`);
    await queryRunner.query(`DROP INDEX "IDX_saved_variants_user_id_is_favorite"`);
    await queryRunner.query(`DROP INDEX "IDX_saved_variants_user_id_category_id"`);
    await queryRunner.query(`DROP INDEX "IDX_saved_variants_user_id_created_at"`);
    await queryRunner.query(`ALTER TABLE "saved_variants" DROP CONSTRAINT "FK_saved_variants_category_id"`);
    await queryRunner.query(`ALTER TABLE "saved_variants" DROP CONSTRAINT "FK_saved_variants_user_id"`);
    await queryRunner.query(`DROP TABLE "saved_variants"`);
  }
}