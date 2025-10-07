import { IsString, IsOptional, IsNotEmpty, MaxLength, IsEnum, IsInt, Min, Max, IsArray } from 'class-validator';
import { AudienceExperienceLevel, AudienceCommunicationStyle, AudienceVocabularyLevel } from '../../../entities/audience.entity';

export class CreateAudienceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(AudienceExperienceLevel)
  @IsOptional()
  experienceLevel?: AudienceExperienceLevel;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  technicalDepth?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  preferredLearningStyle?: string;

  @IsEnum(AudienceCommunicationStyle)
  @IsOptional()
  communicationStyle?: AudienceCommunicationStyle;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  exampleTypes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  avoidTopics?: string[];

  @IsEnum(AudienceVocabularyLevel)
  @IsOptional()
  vocabularyLevel?: AudienceVocabularyLevel;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  promptInstructions?: string;
}
