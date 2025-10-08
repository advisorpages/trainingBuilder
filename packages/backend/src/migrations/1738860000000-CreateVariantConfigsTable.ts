import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVariantConfigsTable1738860000000 implements MigrationInterface {
  name = 'CreateVariantConfigsTable1738860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create variant_configs table
    await queryRunner.query(`
      CREATE TABLE "variant_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "variant_index" integer NOT NULL,
        "label" character varying(100) NOT NULL,
        "description" text NOT NULL,
        "instruction" text NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "version" integer NOT NULL DEFAULT 1,
        "metadata" jsonb,
        CONSTRAINT "UQ_variant_configs_variant_index" UNIQUE ("variant_index"),
        CONSTRAINT "PK_variant_configs" PRIMARY KEY ("id")
      )
    `);

    // Create index
    await queryRunner.query(`
      CREATE INDEX "IDX_variant_configs_variant_index_is_active" ON "variant_configs" ("variant_index", "is_active")
    `);

    // Seed default variants
    await queryRunner.query(`
      INSERT INTO "variant_configs" ("variant_index", "label", "description", "instruction", "is_active", "version")
      VALUES
        (
          0,
          'Knowledge Base-Driven',
          'Proven frameworks and trusted playbook approach. Data-backed and familiar structure.',
          'Lean heavily on the supplied knowledge base insights. Reference the retrieved materials throughout, reinforcing proven frameworks and terminology. Make this variant feel like the trusted playbook version while still matching the desired outcome. Ensure this outline is measurably different from the other variants by how it applies the knowledge base versus new ideas.',
          true,
          1
        ),
        (
          1,
          'Recommended Mix',
          'Balanced mix of teaching and hands-on practice. Includes breakout activities and group reflection.',
          'Blend reliable teaching moments with collaborative practice. Include at least one breakout or group-working segment and one guided reflection checkpoint. Balance knowledge transfer with application so this option feels like the well-rounded agenda. Ensure this outline is measurably different from the other variants by how it applies the knowledge base versus new ideas.',
          true,
          1
        ),
        (
          2,
          'Creative Approach',
          'High-energy, imaginative approach. Features storytelling, role-play, and unexpected activities.',
          'Deliver a creative spin. Start with an energizing warm-up, weave in storytelling or role-play, and introduce an unexpected activity that stretches participants. Encourage experimentation and emotional engagement so this outline feels imaginative and high-energy. Ensure this outline is measurably different from the other variants through its structure, pacing, and activity choices.',
          true,
          1
        ),
        (
          3,
          'Alternative Structure',
          'Fast-paced, action-focused session. Short segments with peer coaching and concrete commitments.',
          'Reframe into shorter, high-momentum segments leading to concrete commitments. Use rapid cycles of activity, peer coaching, and checkpoint debriefs, finishing with an action-planning close. This option should feel fast-paced and accountability-focused. Ensure this outline is measurably different from the other variants through its structure, pacing, and activity choices.',
          true,
          1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_variant_configs_variant_index_is_active"`);
    await queryRunner.query(`DROP TABLE "variant_configs"`);
  }
}
