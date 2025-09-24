import { FlexibleSessionSection, SessionOutlineLegacy, FlexibleSessionOutline, SessionTemplate, SectionTypeConfig, SectionType } from '../interfaces/session-outline.interface';
import { v4 as uuidv4 } from 'uuid';

export class SessionOutlineUtils {
  static getSectionTypeConfigs(): Record<SectionType, SectionTypeConfig> {
    return {
      opener: {
        type: 'opener',
        name: 'Opening',
        icon: '🎯',
        description: 'Session introduction and icebreaker',
        defaultDuration: 10,
        requiredFields: ['title', 'description', 'duration'],
        availableFields: ['learningObjectives', 'trainerNotes']
      },
      topic: {
        type: 'topic',
        name: 'Topic',
        icon: '📚',
        description: 'Educational content and learning material',
        defaultDuration: 25,
        requiredFields: ['title', 'description', 'duration'],
        availableFields: ['learningObjectives', 'suggestedActivities', 'materialsNeeded', 'learningOutcomes', 'trainerNotes', 'deliveryGuidance']
      },
      exercise: {
        type: 'exercise',
        name: 'Interactive Exercise',
        icon: '🎮',
        description: 'Hands-on activities and exercises',
        defaultDuration: 20,
        requiredFields: ['title', 'description', 'duration', 'exerciseType'],
        availableFields: ['exerciseInstructions', 'materialsNeeded', 'engagementType', 'learningObjectives', 'trainerNotes']
      },
      video: {
        type: 'video',
        name: 'Video Content',
        icon: '🎥',
        description: 'Video presentations or media',
        defaultDuration: 15,
        requiredFields: ['title', 'description', 'duration'],
        availableFields: ['mediaUrl', 'mediaDuration', 'suggestions', 'trainerNotes']
      },
      discussion: {
        type: 'discussion',
        name: 'Discussion',
        icon: '💬',
        description: 'Group discussions and Q&A',
        defaultDuration: 15,
        requiredFields: ['title', 'description', 'duration'],
        availableFields: ['discussionPrompts', 'engagementType', 'learningObjectives', 'trainerNotes']
      },
      presentation: {
        type: 'presentation',
        name: 'Presentation',
        icon: '🎤',
        description: 'Formal presentations and speeches',
        defaultDuration: 20,
        requiredFields: ['title', 'description', 'duration'],
        availableFields: ['learningObjectives', 'materialsNeeded', 'trainerNotes', 'deliveryGuidance']
      },
      inspiration: {
        type: 'inspiration',
        name: 'Inspiration',
        icon: '✨',
        description: 'Motivational content and stories',
        defaultDuration: 10,
        requiredFields: ['title', 'description', 'duration'],
        availableFields: ['inspirationType', 'suggestions', 'mediaUrl', 'trainerNotes']
      },
      break: {
        type: 'break',
        name: 'Break',
        icon: '☕',
        description: 'Rest and networking break',
        defaultDuration: 15,
        requiredFields: ['title', 'duration'],
        availableFields: ['description', 'trainerNotes']
      },
      assessment: {
        type: 'assessment',
        name: 'Assessment',
        icon: '📋',
        description: 'Knowledge checks and evaluations',
        defaultDuration: 10,
        requiredFields: ['title', 'description', 'duration', 'assessmentType'],
        availableFields: ['assessmentCriteria', 'trainerNotes', 'deliveryGuidance']
      },
      closing: {
        type: 'closing',
        name: 'Closing',
        icon: '🏁',
        description: 'Session wrap-up and next steps',
        defaultDuration: 10,
        requiredFields: ['title', 'description', 'duration'],
        availableFields: ['keyTakeaways', 'actionItems', 'nextSteps', 'trainerNotes']
      },
      custom: {
        type: 'custom',
        name: 'Custom Section',
        icon: '⚙️',
        description: 'Custom content section',
        defaultDuration: 15,
        requiredFields: ['title', 'description', 'duration'],
        availableFields: ['learningObjectives', 'materialsNeeded', 'trainerNotes', 'deliveryGuidance']
      }
    };
  }

  static createDefaultSection(type: SectionType, position: number): FlexibleSessionSection {
    const config = this.getSectionTypeConfigs()[type];
    return {
      id: uuidv4(),
      type,
      position,
      title: `New ${config.name}`,
      duration: config.defaultDuration,
      description: `Add description for this ${config.name.toLowerCase()}`,
      icon: config.icon,
      isCollapsible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static getDefaultTemplate(): SessionTemplate {
    const sections: FlexibleSessionSection[] = [
      {
        id: uuidv4(),
        type: 'opener',
        position: 1,
        title: 'Welcome & Introductions',
        duration: 10,
        description: 'Welcome participants and set the stage for learning',
        icon: '🎯',
        isRequired: true,
        isCollapsible: false,
        learningObjectives: ['Create a welcoming environment', 'Introduce session objectives'],
        trainerNotes: 'Start with energy and enthusiasm. Make eye contact and engage participants immediately.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        type: 'topic',
        position: 2,
        title: 'Core Learning Topic',
        duration: 25,
        description: 'Main educational content and key concepts',
        icon: '📚',
        isCollapsible: true,
        learningObjectives: ['Understand key concepts', 'Apply new knowledge'],
        suggestedActivities: ['Interactive examples', 'Case studies', 'Q&A sessions'],
        materialsNeeded: ['Presentation slides', 'handouts', 'whiteboard'],
        trainerNotes: 'Break down complex concepts into digestible parts. Use examples relevant to the audience.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        type: 'exercise',
        position: 3,
        title: 'Interactive Practice Exercise',
        duration: 20,
        description: 'Hands-on exercise to reinforce learning',
        icon: '🎮',
        isExercise: true,
        exerciseType: 'activity',
        isCollapsible: true,
        exerciseInstructions: 'Guide participants through hands-on practice of the concepts learned.',
        engagementType: 'small-groups',
        materialsNeeded: ['Worksheets', 'flipchart paper', 'markers'],
        trainerNotes: 'Circulate among groups to provide guidance. Encourage collaboration and peer learning.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        type: 'inspiration',
        position: 4,
        title: 'Inspirational Content',
        duration: 10,
        description: 'Motivating video, story, or case study',
        icon: '✨',
        isCollapsible: true,
        inspirationType: 'video',
        suggestions: [
          'Relevant success story',
          'Industry best practices video',
          'Motivational case study'
        ],
        trainerNotes: 'Choose content that resonates with your specific audience. Keep it relevant and actionable.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        type: 'closing',
        position: 5,
        title: 'Wrap-up & Next Steps',
        duration: 10,
        description: 'Session summary and action planning',
        icon: '🏁',
        isRequired: true,
        isCollapsible: false,
        keyTakeaways: [
          'Key learning point 1',
          'Key learning point 2',
          'Key learning point 3'
        ],
        actionItems: [
          'Immediate action to take',
          'Follow-up task',
          'Long-term goal'
        ],
        nextSteps: ['Continue learning resources', 'Practice opportunities'],
        trainerNotes: 'End on a positive, actionable note. Ensure participants leave with clear next steps.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return {
      id: uuidv4(),
      name: 'Standard Training Session',
      description: 'The classic training session structure with opener, content, exercise, inspiration, and closing',
      category: 'General',
      sections,
      totalDuration: sections.reduce((total, section) => total + section.duration, 0),
      difficulty: 'beginner',
      recommendedAudienceSize: '10-25 participants',
      tags: ['default', 'training', 'standard', 'beginner-friendly'],
      isDefault: true,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static convertLegacyToFlexible(legacy: SessionOutlineLegacy): FlexibleSessionOutline {
    const sections: FlexibleSessionSection[] = [
      {
        id: uuidv4(),
        type: 'opener',
        position: 1,
        title: legacy.opener.title,
        duration: legacy.opener.duration,
        description: legacy.opener.description,
        icon: '🎯',
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        type: 'topic',
        position: 2,
        title: legacy.topic1.title,
        duration: legacy.topic1.duration,
        description: legacy.topic1.description,
        icon: '📚',
        learningObjectives: legacy.topic1.learningObjectives,
        suggestedActivities: legacy.topic1.suggestedActivities,
        materialsNeeded: legacy.topic1.materialsNeeded,
        learningOutcomes: legacy.topic1.learningOutcomes,
        trainerNotes: legacy.topic1.trainerNotes,
        deliveryGuidance: legacy.topic1.deliveryGuidance,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        type: 'exercise',
        position: 3,
        title: legacy.topic2.title,
        duration: legacy.topic2.duration,
        description: legacy.topic2.description,
        icon: '🎮',
        isExercise: true,
        exerciseType: legacy.topic2.engagementType as any,
        learningObjectives: legacy.topic2.learningObjectives,
        suggestedActivities: legacy.topic2.suggestedActivities,
        materialsNeeded: legacy.topic2.materialsNeeded,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        type: 'inspiration',
        position: 4,
        title: legacy.inspirationalContent.title,
        duration: legacy.inspirationalContent.duration,
        description: legacy.inspirationalContent.description || '',
        icon: '✨',
        inspirationType: legacy.inspirationalContent.type as any,
        suggestions: legacy.inspirationalContent.suggestions,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        type: 'closing',
        position: 5,
        title: legacy.closing.title,
        duration: legacy.closing.duration,
        description: legacy.closing.description,
        icon: '🏁',
        isRequired: true,
        keyTakeaways: legacy.closing.keyTakeaways,
        actionItems: legacy.closing.actionItems,
        nextSteps: legacy.closing.nextSteps,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return {
      sections,
      totalDuration: legacy.totalDuration,
      suggestedSessionTitle: legacy.suggestedSessionTitle,
      suggestedDescription: legacy.suggestedDescription,
      difficulty: legacy.difficulty,
      recommendedAudienceSize: legacy.recommendedAudienceSize,
      ragSuggestions: legacy.ragSuggestions,
      fallbackUsed: legacy.fallbackUsed,
      generatedAt: legacy.generatedAt
    };
  }

  static validateSection(section: FlexibleSessionSection): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.getSectionTypeConfigs()[section.type];

    if (!config) {
      errors.push(`Invalid section type: ${section.type}`);
      return { isValid: false, errors };
    }

    // Check required fields
    for (const field of config.requiredFields) {
      if (!section[field as keyof FlexibleSessionSection] && section[field as keyof FlexibleSessionSection] !== 0) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate duration
    if (section.duration < 1 || section.duration > 480) {
      errors.push('Duration must be between 1 and 480 minutes');
    }

    // Validate position
    if (section.position < 1) {
      errors.push('Position must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sortSectionsByPosition(sections: FlexibleSessionSection[]): FlexibleSessionSection[] {
    return sections.sort((a, b) => a.position - b.position);
  }

  static updateSectionPositions(sections: FlexibleSessionSection[]): FlexibleSessionSection[] {
    const sorted = this.sortSectionsByPosition(sections);
    return sorted.map((section, index) => ({
      ...section,
      position: index + 1,
      updatedAt: new Date()
    }));
  }

  static calculateTotalDuration(sections: FlexibleSessionSection[]): number {
    return sections.reduce((total, section) => total + section.duration, 0);
  }
}