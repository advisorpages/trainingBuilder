import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateRagSettingsTable1738900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'rag_settings',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'api_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'timeout_ms',
            type: 'int',
            default: 10000,
          },
          {
            name: 'retry_attempts',
            type: 'int',
            default: 1,
          },
          {
            name: 'max_results',
            type: 'int',
            default: 8,
          },
          {
            name: 'similarity_weight',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0.5,
          },
          {
            name: 'recency_weight',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0.2,
          },
          {
            name: 'category_weight',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0.2,
          },
          {
            name: 'base_score',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0.1,
          },
          {
            name: 'similarity_threshold',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0.65,
          },
          {
            name: 'variant_1_weight',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0.8,
          },
          {
            name: 'variant_2_weight',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0.5,
          },
          {
            name: 'variant_3_weight',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0.2,
          },
          {
            name: 'variant_4_weight',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0.0,
          },
          {
            name: 'query_template',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'use_category_filter',
            type: 'boolean',
            default: true,
          },
          {
            name: 'use_recency_scoring',
            type: 'boolean',
            default: true,
          },
          {
            name: 'last_tested_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'last_tested_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'last_test_status',
            type: 'varchar',
            length: '50',
            default: "'never'",
          },
          {
            name: 'last_test_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Insert default settings with simplified query template
    await queryRunner.query(`
      INSERT INTO rag_settings (
        api_url,
        timeout_ms,
        retry_attempts,
        max_results,
        similarity_weight,
        recency_weight,
        category_weight,
        base_score,
        similarity_threshold,
        variant_1_weight,
        variant_2_weight,
        variant_3_weight,
        variant_4_weight,
        query_template,
        enabled,
        use_category_filter,
        use_recency_scoring,
        last_test_status
      ) VALUES (
        NULL,
        10000,
        1,
        8,
        0.5,
        0.2,
        0.2,
        0.1,
        0.65,
        0.8,
        0.5,
        0.2,
        0.0,
        'Find training materials for a {{sessionType}} session on {{category}}{{#if specificTopics}} covering: {{specificTopics}}{{/if}}.

{{#if audienceName}}TARGET AUDIENCE
Audience: {{audienceName}}{{#if experienceLevel}} ({{experienceLevel}} level){{/if}}
{{#if audienceDescription}}Profile: {{audienceDescription}}{{/if}}
{{#if communicationStyle}}Communication Preference: {{communicationStyle}}{{/if}}
{{#if preferredLearningStyle}}Learning Style: {{preferredLearningStyle}}{{/if}}
{{#if technicalDepth}}Technical Depth: {{technicalDepth}}/5{{/if}}
{{#if avoidTopics}}⚠️ Avoid Topics: {{avoidTopics}}{{/if}}

{{/if}}LEARNING OBJECTIVES
Goal: {{desiredOutcome}}
{{#if currentProblem}}Current Challenge: {{currentProblem}}{{/if}}

{{#if duration}}SESSION DETAILS
Duration: {{duration}} minutes
{{/if}}{{#if toneStyle}}Delivery Style: {{toneStyle}}{{#if energyLevel}} with {{energyLevel}} energy{{/if}}{{#if formality}}, formality {{formality}}/5{{/if}}
{{/if}}{{#if toneDescription}}Tone: {{toneDescription}}
{{/if}}
CONTENT REQUIREMENTS
{{#if vocabularyLevel}}- Vocabulary: {{vocabularyLevel}} level{{/if}}
{{#if exampleTypes}}- Example Types: {{exampleTypes}}{{/if}}
{{#if preferredLearningStyle}}- Learning Approach: {{preferredLearningStyle}}{{/if}}
{{#if sentenceStructure}}- Sentence Structure: {{sentenceStructure}}{{/if}}
{{#if languageCharacteristics}}- Language Style: {{languageCharacteristics}}{{/if}}
{{#if emotionalResonance}}- Emotional Impact: {{emotionalResonance}}{{/if}}

Please find relevant training materials, case studies, exercises, and best practices that match these criteria.',
        true,
        true,
        true,
        'never'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('rag_settings');
  }
}
