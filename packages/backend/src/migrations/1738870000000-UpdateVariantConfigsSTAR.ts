import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateVariantConfigsSTAR1738870000000 implements MigrationInterface {
  name = 'UpdateVariantConfigsSTAR1738870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update Variant 0: Precision (Structure personality)
    await queryRunner.query(`
      UPDATE "variant_configs"
      SET
        "label" = 'Precision',
        "description" = 'Clear, step-by-step approach with predictable flow and detailed guidance. Ideal for structured learning.',
        "instruction" = 'Create a highly organized session with clear time blocks, detailed agendas, and sequential steps. Use structured frameworks and prescriptive guidance. Follow this {{duration}}-minute structure: Opening (~10%), Theory (~30%), Application (~30%), Video (~15%), Closing+CTA (~15%). Include specific talking points, checklists, and exact activities that trainers can follow verbatim. Every section should have explicit objectives and outcomes. Make instructions crystal-clear for less experienced trainers. When knowledge base insights are available, present them in an organized, systematic way. Ensure this variant feels predictable and orderly.',
        "version" = "version" + 1,
        "updated_at" = now()
      WHERE "variant_index" = 0
    `);

    // Update Variant 1: Insight (Technical personality)
    await queryRunner.query(`
      UPDATE "variant_configs"
      SET
        "label" = 'Insight',
        "description" = 'Evidence-based approach with data, research, and proven strategies. Ideal for analytical thinkers.',
        "instruction" = 'Build a logic-driven session emphasizing facts, statistics, case studies, and measurable outcomes. Follow this {{duration}}-minute structure: Opening (~10%), Theory (~30%), Application (~30%), Video (~15%), Closing+CTA (~15%). Use data to support each teaching point. Include analysis activities, research findings, and evidence-based practices. Provide specific metrics, concrete examples, and factual talking points trainers can reference. Present knowledge base insights with statistics and proof points. Design application exercises around analyzing real scenarios and drawing logical conclusions. Ensure this variant feels data-backed and intellectually rigorous.',
        "version" = "version" + 1,
        "updated_at" = now()
      WHERE "variant_index" = 1
    `);

    // Update Variant 2: Ignite (Action personality)
    await queryRunner.query(`
      UPDATE "variant_configs"
      SET
        "label" = 'Ignite',
        "description" = 'Fast-paced, results-oriented session with immediate takeaways and momentum. Ideal for action-takers.',
        "instruction" = 'Design a high-energy session focused on quick wins and immediate action. Follow this {{duration}}-minute structure: Opening (~10%), Theory (~20%), Application (~35%), Video (~15%), Closing+CTA (~20%). Use rapid-fire activities, time-boxed exercises, and goal-oriented challenges. Keep theory concise and punchy—focus on "what to do now." Make application section intensive with momentum-building activities. Include specific action items and clear next steps trainers can drive with urgency. Provide prescriptive guidance for less experienced trainers to maintain energy. When knowledge base insights exist, present them as quick wins and proven tactics. Ensure this variant feels fast-paced and results-driven.',
        "version" = "version" + 1,
        "updated_at" = now()
      WHERE "variant_index" = 2
    `);

    // Update Variant 3: Connect (Relationships personality)
    await queryRunner.query(`
      UPDATE "variant_configs"
      SET
        "label" = 'Connect',
        "description" = 'Story-driven, collaborative approach building rapport and real-world connection. Ideal for relationship-builders.',
        "instruction" = 'Create a people-centered session using stories, real-world scenarios, and collaborative activities. Follow this {{duration}}-minute structure: Opening (~10%), Theory (~25%), Application (~30%), Video (~15%), Closing+CTA (~20%). Include peer discussions, group sharing, and relationship-building exercises. Use storytelling, empathy, and authentic connection. Design application activities that encourage advisors to learn from each other through role-plays and peer coaching. Provide trainers with discussion prompts, facilitation guidance, and stories they can tell. Present knowledge base insights as real advisor success stories and relatable examples. Ensure this variant feels warm, collaborative, and human-centered.',
        "version" = "version" + 1,
        "updated_at" = now()
      WHERE "variant_index" = 3
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback to original variant configs
    await queryRunner.query(`
      UPDATE "variant_configs"
      SET
        "label" = 'Knowledge Base-Driven',
        "description" = 'Proven frameworks and trusted playbook approach. Data-backed and familiar structure.',
        "instruction" = 'Lean heavily on the supplied knowledge base insights. Reference the retrieved materials throughout, reinforcing proven frameworks and terminology. Make this variant feel like the trusted playbook version while still matching the desired outcome. Ensure this outline is measurably different from the other variants by how it applies the knowledge base versus new ideas.',
        "version" = "version" - 1,
        "updated_at" = now()
      WHERE "variant_index" = 0
    `);

    await queryRunner.query(`
      UPDATE "variant_configs"
      SET
        "label" = 'Recommended Mix',
        "description" = 'Balanced mix of teaching and hands-on practice. Includes breakout activities and group reflection.',
        "instruction" = 'Blend reliable teaching moments with collaborative practice. Include at least one breakout or group-working segment and one guided reflection checkpoint. Balance knowledge transfer with application so this option feels like the well-rounded agenda. Ensure this outline is measurably different from the other variants by how it applies the knowledge base versus new ideas.',
        "version" = "version" - 1,
        "updated_at" = now()
      WHERE "variant_index" = 1
    `);

    await queryRunner.query(`
      UPDATE "variant_configs"
      SET
        "label" = 'Creative Approach',
        "description" = 'High-energy, imaginative approach. Features storytelling, role-play, and unexpected activities.',
        "instruction" = 'Deliver a creative spin. Start with an energizing warm-up, weave in storytelling or role-play, and introduce an unexpected activity that stretches participants. Encourage experimentation and emotional engagement so this outline feels imaginative and high-energy. Ensure this outline is measurably different from the other variants through its structure, pacing, and activity choices.',
        "version" = "version" - 1,
        "updated_at" = now()
      WHERE "variant_index" = 2
    `);

    await queryRunner.query(`
      UPDATE "variant_configs"
      SET
        "label" = 'Alternative Structure',
        "description" = 'Fast-paced, action-focused session. Short segments with peer coaching and concrete commitments.',
        "instruction" = 'Reframe into shorter, high-momentum segments leading to concrete commitments. Use rapid cycles of activity, peer coaching, and checkpoint debriefs, finishing with an action-planning close. This option should feel fast-paced and accountability-focused. Ensure this outline is measurably different from the other variants through its structure, pacing, and activity choices.',
        "version" = "version" - 1,
        "updated_at" = now()
      WHERE "variant_index" = 3
    `);
  }
}
