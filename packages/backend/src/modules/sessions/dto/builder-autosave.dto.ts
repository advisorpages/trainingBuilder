import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class BuilderAutosaveDto {
  @IsObject()
  metadata: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  outline?: Record<string, unknown> | null;

  @IsString()
  aiPrompt: string;

  @IsArray()
  aiVersions: unknown[];

  @IsOptional()
  @IsString()
  acceptedVersionId?: string;

  @IsOptional()
  @IsNumber()
  readinessScore?: number;
}

