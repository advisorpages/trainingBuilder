export interface SessionOutlineSection {
  title: string;
  duration: number; // duration in minutes
  description: string;
}

export interface TopicSection extends SessionOutlineSection {
  learningObjectives: string[];
  suggestedActivities?: string[];
  materialsNeeded?: string[];

  // Enhanced topic properties (aligned with Topic entity)
  isExercise?: boolean;
  exerciseType?: 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play' | 'presentation';
  exerciseInstructions?: string;
  estimatedDuration?: number;

  // AI enhancement support
  aiGeneratedContent?: object;
  learningOutcomes?: string;
  trainerNotes?: string;
  deliveryGuidance?: string;
}

export interface ExerciseTopicSection extends TopicSection {
  exerciseDescription: string;
  engagementType: 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play';
}

export interface InspirationSection {
  title: string;
  duration: number;
  type: 'video' | 'story' | 'quote' | 'case-study';
  suggestions: string[];
  description?: string;
}

export interface ClosingSection extends SessionOutlineSection {
  keyTakeaways: string[];
  actionItems: string[];
  nextSteps?: string[];
}

// Legacy interface - kept for backward compatibility
export interface SessionOutlineLegacy {
  // Session structure following the specified format
  opener: SessionOutlineSection;
  topic1: TopicSection;
  topic2: ExerciseTopicSection;
  inspirationalContent: InspirationSection;
  closing: ClosingSection;

  // Metadata
  totalDuration: number;
  suggestedSessionTitle: string;
  suggestedDescription: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  recommendedAudienceSize: string;

  // RAG enhancement data
  ragSuggestions?: any;
  fallbackUsed: boolean; // true if RAG was unavailable
  generatedAt: Date;
}

// Primary interface - flexible session outline structure
export type SessionOutline = FlexibleSessionOutline

// Enhanced flexible session outline interface
export interface FlexibleSessionOutline {
  // Dynamic section structure
  sections: FlexibleSessionSection[];

  // Metadata
  totalDuration: number;
  suggestedSessionTitle: string;
  suggestedDescription: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  recommendedAudienceSize: string;

  // RAG enhancement data
  ragSuggestions?: any;
  fallbackUsed: boolean;
  generatedAt: Date;
}

export interface FlexibleSessionSection {
  id: string;
  type: 'opener' | 'topic' | 'exercise' | 'inspiration' | 'closing' | 'video' | 'discussion' | 'presentation' | 'break' | 'assessment' | 'custom';
  position: number; // order in session
  title: string;
  duration: number;
  description: string;
  isRequired?: boolean; // Some sections may be required (e.g., opener, closing)
  isCollapsible?: boolean; // Whether section can be collapsed in UI
  icon?: string; // Icon for UI display

  // Topic/Exercise specific properties
  isExercise?: boolean;
  exerciseType?: 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play' | 'presentation' | 'reflection' | 'assessment' | 'group-work';
  exerciseInstructions?: string;
  learningObjectives?: string[];
  materialsNeeded?: string[];
  suggestedActivities?: string[];

  // Inspiration/Media section properties
  inspirationType?: 'video' | 'story' | 'quote' | 'case-study' | 'audio' | 'image' | 'external-link';
  mediaUrl?: string;
  mediaDuration?: number;
  suggestions?: string[];

  // Closing section properties
  keyTakeaways?: string[];
  actionItems?: string[];
  nextSteps?: string[];

  // Discussion/Interactive section properties
  discussionPrompts?: string[];
  engagementType?: 'individual' | 'pairs' | 'small-groups' | 'full-group';

  // Assessment properties
  assessmentType?: 'quiz' | 'reflection' | 'peer-review' | 'self-assessment';
  assessmentCriteria?: string[];

  // AI enhancement support
  aiGeneratedContent?: object;
  learningOutcomes?: string;
  trainerNotes?: string;
  deliveryGuidance?: string;

  // Speaker assignment (for topic/presentation-style sections)
  trainerId?: number;
  trainerName?: string; // denormalized for convenience in UI
  speakerDuration?: number; // minutes of speaking time inside the section

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  isTemplate?: boolean;
  templateId?: string;
}

// Template system interfaces
export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  sections: FlexibleSessionSection[];
  totalDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  recommendedAudienceSize: string;
  tags: string[];
  isDefault: boolean;
  isPublic: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Utility types for section management
export type SectionType = FlexibleSessionSection['type'];

export interface SectionTypeConfig {
  type: SectionType;
  name: string;
  icon: string;
  description: string;
  defaultDuration: number;
  requiredFields: string[];
  availableFields: string[];
}

// Legacy conversion utility type
export interface OutlineConversion {
  legacy: SessionOutlineLegacy;
  flexible: FlexibleSessionOutline;
  conversionMetadata: {
    convertedAt: Date;
    originalVersion: string;
    migrationRules: string[];
  };
}
