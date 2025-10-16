import { IsEnum, IsOptional, IsString, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationType, MeetingPlatform } from '../../../entities';

export class TopicDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  learningOutcomes?: string;

  @IsOptional()
  @IsString()
  trainerNotes?: string;

  @IsOptional()
  @IsString()
  materialsNeeded?: string;

  @IsOptional()
  @IsString()
  deliveryGuidance?: string;

  @IsOptional()
  @IsString()
  callToAction?: string;

  @IsOptional()
  @IsNumber()
  topicId?: number;
}

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicDto)
  topics?: TopicDto[];

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
  marketingToneId?: number;

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
  callToAction?: string;
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
