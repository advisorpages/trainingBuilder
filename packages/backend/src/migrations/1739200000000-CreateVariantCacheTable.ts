import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVariantCacheTable1739200000000 implements MigrationInterface {
  name = 'CreateVariantCacheTable1739200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create variant_cache table
    await queryRunner.query(`
      CREATE TABLE "variant_cache" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "cache_key_hash" character varying(64) NOT NULL,
        "variant_index" integer NOT NULL,
        "generated_outline" jsonb NOT NULL,
        "request_hash" character varying(64) NOT NULL,
        "last_accessed" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "hit_count" integer NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "UQ_variant_cache_cache_key_hash_variant_index" UNIQUE ("cache_key_hash", "variant_index"),
        CONSTRAINT "PK_variant_cache" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_variant_cache_cache_key_hash_variant_index" ON "variant_cache" ("cache_key_hash", "variant_index")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_variant_cache_expires_at" ON "variant_cache" ("expires_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_variant_cache_last_accessed" ON "variant_cache" ("last_accessed")
    `);

    // Add comments for documentation
    await queryRunner.query(`
      COMMENT ON TABLE "variant_cache" IS 'Cache for generated session outline variants to reduce API token usage'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "variant_cache"."cache_key_hash" IS 'SHA256 hash of cacheable request parameters'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "variant_cache"."variant_index" IS '0-3 for the 4 variant slots'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "variant_cache"."generated_outline" IS 'The OpenAI generated session outline'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "variant_cache"."request_hash" IS 'Hash of full request for collision detection'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "variant_cache"."last_accessed" IS 'Track for LRU eviction'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "variant_cache"."hit_count" IS 'Analytics for cache effectiveness'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "variant_cache"."expires_at" IS 'TTL for automatic cleanup'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_variant_cache_last_accessed"`);
    await queryRunner.query(`DROP INDEX "IDX_variant_cache_expires_at"`);
    await queryRunner.query(`DROP INDEX "IDX_variant_cache_cache_key_hash_variant_index"`);
    await queryRunner.query(`DROP TABLE "variant_cache"`);
  }
}