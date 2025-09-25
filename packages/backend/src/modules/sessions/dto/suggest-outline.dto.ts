import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SuggestedSessionType {
  EVENT = 'event',
  TRAINING = 'training',
  WORKSHOP = 'workshop',
  WEBINAR = 'webinar',
}

export class SuggestOutlineDto {
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

