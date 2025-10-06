import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultCategories1735766600000 implements MigrationInterface {
  name = 'SeedDefaultCategories1735766600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert default categories
    await queryRunner.query(`
      INSERT INTO "categories" ("name", "description", "is_active") VALUES
      ('Leadership Development', 'Sessions focused on developing leadership skills and capabilities', true),
      ('Communication Skills', 'Training on effective communication, presentation, and interpersonal skills', true),
      ('Team Building', 'Activities and workshops designed to strengthen team dynamics and collaboration', true),
      ('Professional Development', 'General professional growth and career advancement topics', true),
      ('Change Management', 'Training on managing and leading through organizational change', true),
      ('Strategic Planning', 'Sessions on strategic thinking, planning, and execution', true),
      ('Conflict Resolution', 'Training on managing and resolving workplace conflicts', true),
      ('Performance Management', 'Sessions on managing team performance and giving feedback', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the seeded categories (only remove the exact ones we added)
    await queryRunner.query(`
      DELETE FROM "categories"
      WHERE "name" IN (
        'Leadership Development',
        'Communication Skills',
        'Team Building',
        'Professional Development',
        'Change Management',
        'Strategic Planning',
        'Conflict Resolution',
        'Performance Management'
      )
    `);
  }
}