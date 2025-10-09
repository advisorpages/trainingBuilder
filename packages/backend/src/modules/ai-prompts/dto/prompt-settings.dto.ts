import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class VariantPersonaDto {
  @IsString()
  id: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  prompt: string;
}

export class GlobalToneDto {
  @IsString()
  toneGuidelines: string;

  @IsString()
  systemGuidelines: string;
}

export class DurationFlowDto {
  @IsString()
  pacingGuidelines: string;

  @IsString()
  structuralNotes: string;
}

export class QuickTweaksDto {
  @IsBoolean()
  increaseDataEmphasis: boolean;

  @IsBoolean()
  speedUpPace: boolean;

  @IsBoolean()
  raiseRagPriority: boolean;
}

export class PromptSandboxSettingsDto {
  @IsString()
  version: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantPersonaDto)
  variantPersonas: VariantPersonaDto[];

  @ValidateNested()
  @Type(() => GlobalToneDto)
  globalTone: GlobalToneDto;

  @ValidateNested()
  @Type(() => DurationFlowDto)
  durationFlow: DurationFlowDto;

  @ValidateNested()
  @Type(() => QuickTweaksDto)
  quickTweaks: QuickTweaksDto;
}

export class UpdateCurrentPromptSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PromptSandboxSettingsDto)
  settings?: PromptSandboxSettingsDto;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  actor?: string;

  @IsOptional()
  @IsString()
  sourceOverrideId?: string;
}

export class CreatePromptOverrideDto {
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  actor?: string;

  @ValidateNested()
  @Type(() => PromptSandboxSettingsDto)
  settings: PromptSandboxSettingsDto;
}

