import { IsOptional, IsString, IsObject, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTopicDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

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
