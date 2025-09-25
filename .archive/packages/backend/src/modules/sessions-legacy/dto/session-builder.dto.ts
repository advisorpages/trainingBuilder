import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SessionType {
  EVENT = 'event',
  TRAINING = 'training',
  WORKSHOP = 'workshop',
  WEBINAR = 'webinar'
}

export class SuggestSessionOutlineDto {
  @IsString()
  category: string;

  @IsEnum(SessionType)
  sessionType: SessionType;

  @IsString()
  desiredOutcome: string;

  @IsOptional()
  @IsString()
  currentProblem?: string;

  @IsOptional()
  @IsString()
  specificTopics?: string;

  @IsDateString()
  date: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  locationId?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  audienceId?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  toneId?: number;
}

export class SessionOutlineResponseDto {
  outline: any; // Will be SessionOutline interface
  relevantTopics: any[]; // Will be Topic entities
  ragAvailable: boolean;
  ragSuggestions?: any;
  generationMetadata: {
    processingTime: number;
    ragQueried: boolean;
    fallbackUsed: boolean;
    topicsFound: number;
  };
}