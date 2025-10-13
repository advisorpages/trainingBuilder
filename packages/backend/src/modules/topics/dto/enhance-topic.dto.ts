import { IsArray, IsInt, IsOptional, IsString, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class TopicSessionContextDto {
  @IsOptional()
  @IsString()
  sessionTitle?: string;

  @IsOptional()
  @IsString()
  sessionDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  existingTopics?: string[];
}

class TopicCurrentContentDto {
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
}

export class TopicEnhancementRequestDto {
  @IsString()
  name: string;

  @IsString()
  learningOutcome: string;

  @Type(() => Number)
  @IsInt()
  categoryId: number;

  @Type(() => Number)
  @IsInt()
  audienceId: number;

  @Type(() => Number)
  @IsInt()
  toneId: number;

  @IsOptional()
  @IsIn(['workshop', 'presentation', 'discussion'])
  @IsString()
  deliveryStyle?: 'workshop' | 'presentation' | 'discussion';

  @IsOptional()
  @IsString()
  specialConsiderations?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TopicSessionContextDto)
  sessionContext?: TopicSessionContextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TopicCurrentContentDto)
  currentContent?: TopicCurrentContentDto;
}
