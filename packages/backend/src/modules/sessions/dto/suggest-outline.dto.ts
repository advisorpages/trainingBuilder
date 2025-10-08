import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LocationType, MeetingPlatform } from '../../../entities';

export enum SuggestedSessionType {
  EVENT = 'event',
  TRAINING = 'training',
  WORKSHOP = 'workshop',
  WEBINAR = 'webinar',
}

export class SuggestOutlineDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  category: string;

  @IsEnum(SuggestedSessionType)
  sessionType: SuggestedSessionType;

  @IsString()
  desiredOutcome: string;

  @IsOptional()
  @IsString()
  currentProblem?: string;

  @IsOptional()
  @IsString()
  specificTopics?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  audienceSize?: string;

  @IsOptional()
  @IsString()
  audienceName?: string;

  @IsOptional()
  audienceId?: number;

  @IsOptional()
  toneId?: number;

  @IsOptional()
  locationId?: number;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType;

  @IsOptional()
  @IsEnum(MeetingPlatform)
  meetingPlatform?: MeetingPlatform;

  @IsOptional()
  locationCapacity?: number;

  @IsOptional()
  @IsString()
  locationTimezone?: string;

  @IsOptional()
  @IsString()
  locationNotes?: string;
}

export interface TopicReference {
  id: number;
  name: string;
  description?: string;
  learningOutcomes?: string;
  trainerNotes?: string;
  materialsNeeded?: string;
  deliveryGuidance?: string;
  matchScore?: number; // How well this topic matches the AI-generated content
}

export interface SuggestedSessionSection {
  id: string;
  type:
    | 'opener'
    | 'topic'
    | 'exercise'
    | 'inspiration'
    | 'closing'
    | 'discussion';
  position: number;
  title: string;
  duration: number;
  description: string;
  learningObjectives?: string[];
  suggestedActivities?: string[];
  associatedTopic?: TopicReference;
  isTopicSuggestion?: boolean; // True if this section suggests creating a new topic
}

export interface SuggestedSessionOutline {
  sections: SuggestedSessionSection[];
  totalDuration: number;
  suggestedSessionTitle: string;
  suggestedDescription: string;
  difficulty: string;
  recommendedAudienceSize: string;
  fallbackUsed: boolean;
  generatedAt: string;
}

export interface SuggestOutlineResponse {
  outline: SuggestedSessionOutline;
  relevantTopics: Array<{ id: string; name: string }>;
  ragAvailable: boolean;
  ragSuggestions?: unknown;
  generationMetadata: {
    processingTime: number;
    ragQueried: boolean;
    fallbackUsed: boolean;
    topicsFound: number;
  };
}
