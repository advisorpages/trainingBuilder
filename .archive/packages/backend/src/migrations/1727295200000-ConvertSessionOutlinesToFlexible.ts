import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertSessionOutlinesToFlexible1727295200000 implements MigrationInterface {
  name = 'ConvertSessionOutlinesToFlexible1727295200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This migration converts existing session outline data from fixed structure to flexible structure

    // Get all sessions with outline data
    const sessions = await queryRunner.query(`
      SELECT id, session_outline_data
      FROM sessions
      WHERE session_outline_data IS NOT NULL
      AND session_outline_data != '{}'::jsonb
    `);

    console.log(`Converting ${sessions.length} session outlines to flexible format...`);

    for (const session of sessions) {
      try {
        const legacyOutline = session.session_outline_data;

        // Skip if already flexible format (has 'sections' array)
        if (legacyOutline.sections) {
          console.log(`Session ${session.id} already has flexible format, skipping`);
          continue;
        }

        // Convert legacy format to flexible format
        const flexibleOutline = this.convertLegacyToFlexible(legacyOutline);

        // Update the session with the new flexible format
        await queryRunner.query(
          `UPDATE sessions SET session_outline_data = $1 WHERE id = $2`,
          [JSON.stringify(flexibleOutline), session.id]
        );

        console.log(`✓ Converted session ${session.id} to flexible format`);
      } catch (error) {
        console.error(`✗ Failed to convert session ${session.id}:`, error.message);
        // Continue with other sessions rather than failing the entire migration
      }
    }

    console.log('Session outline conversion completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration is not easily reversible as it changes data structure
    // In a production environment, you would want to backup the data first
    console.log('WARNING: This migration cannot be automatically reversed');
    console.log('The flexible format contains more information than can be converted back to legacy format');
  }

  private convertLegacyToFlexible(legacy: any): any {
    // Create unique IDs for each section
    const generateId = (type: string, index: number) => `${type}-${Date.now()}-${index}`;

    const sections = [];

    // Convert opener section
    if (legacy.opener) {
      sections.push({
        id: generateId('opener', 1),
        type: 'opener',
        position: 1,
        title: legacy.opener.title || 'Welcome & Introductions',
        duration: legacy.opener.duration || 10,
        description: legacy.opener.description || 'Welcome participants and set the stage for learning',
        icon: '🎯',
        isRequired: true,
        isCollapsible: false,
        trainerNotes: 'Start with energy and enthusiasm. Make eye contact and engage participants immediately.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Convert topic1 section
    if (legacy.topic1) {
      sections.push({
        id: generateId('topic', 2),
        type: 'topic',
        position: 2,
        title: legacy.topic1.title || 'Core Learning Topic',
        duration: legacy.topic1.duration || 25,
        description: legacy.topic1.description || 'Main educational content and key concepts',
        icon: '📚',
        isCollapsible: true,
        learningObjectives: legacy.topic1.learningObjectives || [],
        suggestedActivities: legacy.topic1.suggestedActivities || [],
        materialsNeeded: legacy.topic1.materialsNeeded || [],
        learningOutcomes: legacy.topic1.learningOutcomes,
        trainerNotes: legacy.topic1.trainerNotes || 'Break down complex concepts into digestible parts.',
        deliveryGuidance: legacy.topic1.deliveryGuidance,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Convert topic2 (exercise) section
    if (legacy.topic2) {
      sections.push({
        id: generateId('exercise', 3),
        type: 'exercise',
        position: 3,
        title: legacy.topic2.title || 'Interactive Practice Exercise',
        duration: legacy.topic2.duration || 20,
        description: legacy.topic2.description || 'Hands-on exercise to reinforce learning',
        icon: '🎮',
        isExercise: true,
        isCollapsible: true,
        exerciseType: this.mapEngagementTypeToExerciseType(legacy.topic2.engagementType),
        exerciseDescription: legacy.topic2.exerciseDescription,
        exerciseInstructions: 'Guide participants through hands-on practice of the concepts learned.',
        learningObjectives: legacy.topic2.learningObjectives || [],
        suggestedActivities: legacy.topic2.suggestedActivities || [],
        materialsNeeded: legacy.topic2.materialsNeeded || [],
        engagementType: this.mapLegacyEngagementType(legacy.topic2.engagementType),
        trainerNotes: 'Circulate among groups to provide guidance. Encourage collaboration.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Convert inspirational content section
    if (legacy.inspirationalContent) {
      sections.push({
        id: generateId('inspiration', 4),
        type: 'inspiration',
        position: 4,
        title: legacy.inspirationalContent.title || 'Inspirational Content',
        duration: legacy.inspirationalContent.duration || 10,
        description: legacy.inspirationalContent.description || 'Motivating video, story, or case study',
        icon: '✨',
        isCollapsible: true,
        inspirationType: this.mapLegacyInspirationType(legacy.inspirationalContent.type),
        suggestions: legacy.inspirationalContent.suggestions || [],
        trainerNotes: 'Choose content that resonates with your specific audience.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Convert closing section
    if (legacy.closing) {
      sections.push({
        id: generateId('closing', 5),
        type: 'closing',
        position: 5,
        title: legacy.closing.title || 'Wrap-up & Next Steps',
        duration: legacy.closing.duration || 10,
        description: legacy.closing.description || 'Session summary and action planning',
        icon: '🏁',
        isRequired: true,
        isCollapsible: false,
        keyTakeaways: legacy.closing.keyTakeaways || [],
        actionItems: legacy.closing.actionItems || [],
        nextSteps: legacy.closing.nextSteps || [],
        trainerNotes: 'End on a positive, actionable note. Ensure participants leave with clear next steps.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create the flexible outline structure
    return {
      sections,
      totalDuration: legacy.totalDuration || sections.reduce((sum, s) => sum + s.duration, 0),
      suggestedSessionTitle: legacy.suggestedSessionTitle || 'Training Session',
      suggestedDescription: legacy.suggestedDescription || 'A comprehensive training session',
      difficulty: legacy.difficulty || 'beginner',
      recommendedAudienceSize: legacy.recommendedAudienceSize || '10-25 participants',
      ragSuggestions: legacy.ragSuggestions,
      fallbackUsed: legacy.fallbackUsed || false,
      generatedAt: legacy.generatedAt || new Date(),
      // Mark as converted
      convertedFromLegacy: true,
      convertedAt: new Date()
    };
  }

  private mapEngagementTypeToExerciseType(engagementType: string): string {
    const mapping: { [key: string]: string } = {
      'discussion': 'discussion',
      'activity': 'activity',
      'workshop': 'workshop',
      'case-study': 'case-study',
      'role-play': 'role-play'
    };

    return mapping[engagementType] || 'activity';
  }

  private mapLegacyEngagementType(engagementType: string): string {
    const mapping: { [key: string]: string } = {
      'discussion': 'full-group',
      'activity': 'small-groups',
      'workshop': 'small-groups',
      'case-study': 'pairs',
      'role-play': 'pairs'
    };

    return mapping[engagementType] || 'small-groups';
  }

  private mapLegacyInspirationType(type: string): string {
    const mapping: { [key: string]: string } = {
      'video': 'video',
      'story': 'story',
      'quote': 'quote',
      'case-study': 'case-study'
    };

    return mapping[type] || 'video';
  }
}