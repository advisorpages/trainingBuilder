import { IsOptional, IsString, IsObject } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

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
  @IsObject()
  aiGeneratedContent?: Record<string, unknown>;
}
