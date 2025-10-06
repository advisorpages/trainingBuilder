import { IsEnum, IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { PromptCategory } from '../../../entities/prompt.entity';

export class CreatePromptDto {
  @IsString()
  name: string;

  @IsEnum(PromptCategory)
  category: PromptCategory;

  @IsString()
  template: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @IsOptional()
  @IsString()
  exampleInput?: string;

  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}