// User-related types
export interface User {
  id: string;
  email: string;
  roleId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
  authoredSessions?: Session[];
  authoredIncentives?: Incentive[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  BROKER = 'Broker',
  CONTENT_DEVELOPER = 'Content Developer',
  TRAINER = 'Trainer',
}

// Session-related types
export interface Session {
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
  objective?: string;
  startTime: Date | string;
  endTime: Date | string;
  status: SessionStatus;
  qrCodeUrl?: string;
  authorId: string;
  locationId?: number;
  trainerId?: number;
  audienceId?: number;
  toneId?: number;
  categoryId?: number;
  maxRegistrations: number;
  aiPrompt?: string;
  aiGeneratedContent?: Record<string, any> | string | null;
  promotionalHeadline?: string | null;
  promotionalSummary?: string | null;
  keyBenefits?: string | string[] | null;
  callToAction?: string | null;
  socialMediaContent?: string | string[] | null;
  emailMarketingContent?: string | null;
  publishingStatus?: string | null;
  readinessScore?: number;
  builderGenerated?: boolean;
  sessionOutlineData?: Record<string, any> | null;
  lastAutosaveAt?: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  author: User;
  location?: Location;
  trainer?: Trainer;
  audience?: Audience;
  tone?: Tone;
  category?: Category;
  topics?: Topic[];
}

export enum SessionStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  READY = 'ready',
  PUBLISHED = 'published',
  RETIRED = 'retired',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Resource types
export enum LocationType {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual',
  HYBRID = 'hybrid',
}

export enum MeetingPlatform {
  ZOOM = 'zoom',
  MICROSOFT_TEAMS = 'microsoft_teams',
  GOOGLE_MEET = 'google_meet',
  OTHER = 'other',
}

export interface Location {
  id: number;
  name: string;
  description?: string;
  locationType: LocationType;

  // Physical location fields
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  capacity?: number;

  // Virtual meeting fields
  meetingPlatform?: MeetingPlatform;
  meetingLink?: string;
  meetingId?: string;
  meetingPassword?: string;
  dialInNumber?: string;

  // Common fields
  timezone?: string;
  accessInstructions?: string;
  notes?: string;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  sessions?: Session[];
}

export interface Trainer {
  id: number;
  name: string;
  email: string;
  bio?: string;
  phone?: string;
  expertiseTags?: string[];
  timezone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  sessions?: Session[];
}

export enum SettingDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  category?: string;
  dataType: SettingDataType;
  defaultValue?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  id: number;
  name: string;
  description?: string;
  // AI Enhancement Fields
  aiGeneratedContent?: TopicAIContent | null;
  learningOutcomes?: string;
  trainerNotes?: string;
  materialsNeeded?: string;
  deliveryGuidance?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  sessions?: Session[];
}

// Attribute types
export enum AudienceExperienceLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  MIXED = 'mixed',
}

export enum AudienceCommunicationStyle {
  FORMAL = 'formal',
  CONVERSATIONAL = 'conversational',
  TECHNICAL = 'technical',
  SIMPLIFIED = 'simplified',
}

export enum AudienceVocabularyLevel {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  EXPERT = 'expert',
  INDUSTRY_SPECIFIC = 'industry_specific',
}

export interface Audience {
  id: number;
  name: string;
  description?: string;
  experienceLevel: AudienceExperienceLevel;
  technicalDepth: number; // 1-5 scale
  preferredLearningStyle?: string;
  communicationStyle: AudienceCommunicationStyle;
  exampleTypes: string[];
  avoidTopics: string[];
  vocabularyLevel: AudienceVocabularyLevel;
  promptInstructions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  sessions?: Session[];
}

export interface Tone {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  sessions?: Session[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  sessions?: Session[];
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

// Registration types
export interface Registration {
  id: string;
  sessionId: string;
  name: string;
  email: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
  session?: Session;
}

export interface RegistrationRequest {
  name: string;
  email: string;
  referredBy?: string;
}

// Incentive-related types
export interface Incentive {
  id: string;
  title: string;
  description?: string;
  rules?: string;
  startDate: Date | string;
  endDate: Date | string;
  status: IncentiveStatus;
  authorId: string;
  aiGeneratedContent?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  author: User;
}

export enum IncentiveStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// AI Enhancement Types for Topics
export interface TopicEnhancementInput {
  name: string;
  learningOutcome: string;
  categoryId: number;
  audienceId: number;
  toneId: number;
  deliveryStyle?: 'workshop' | 'presentation' | 'discussion';
  specialConsiderations?: string;
  sessionContext?: {
    sessionTitle?: string;
    sessionDescription?: string;
    existingTopics?: string[];
  };
}

export interface TopicAIContent {
  enhancementContext: {
    audienceId: number;
    audienceName: string;
    toneId: number;
    toneName: string;
    categoryId: number;
    categoryName: string;
    deliveryStyle: 'workshop' | 'presentation' | 'discussion';
    learningOutcome: string;
    sessionContext?: {
      sessionTitle: string;
      sessionDescription?: string;
      existingTopics: string[];
    };
  };

  enhancementMeta: {
    generatedAt: string;
    promptUsed: string;
    aiModel?: string;
    enhancementVersion: string;
  };

  enhancedContent: {
    originalInput: {
      name: string;
      description?: string;
    };

    attendeeSection: {
      enhancedName: string;
      whatYoullLearn: string;
      whoThisIsFor: string;
      keyTakeaways: string[];
      prerequisites?: string;
    };

    trainerSection: {
      deliveryFormat: string;
      preparationGuidance: string;
      keyTeachingPoints: string[];
      recommendedActivities: string[];
      materialsNeeded: string[];
      timeAllocation?: string;
      commonChallenges: string[];
      assessmentSuggestions?: string[];
    };

    enhancedDescription: string;
    callToAction: string;
  };

  userModifications?: {
    modifiedFields: string[];
    lastModified: string;
    customizations: Record<string, any>;
  };
}

export interface TopicEnhancementResponse {
  enhancedTopic: {
    name: string;
    description: string;
    learningOutcomes: string;
    trainerNotes: string;
    materialsNeeded: string;
    deliveryGuidance: string;
    callToAction: string;
  };
  aiContent: TopicAIContent;
  prompt?: string; // For manual mode
}
