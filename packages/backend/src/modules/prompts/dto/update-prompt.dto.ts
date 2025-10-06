import { IsString, IsOptional, IsArray, IsBoolean, IsObject } from 'class-validator';

export class UpdatePromptDto {
  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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