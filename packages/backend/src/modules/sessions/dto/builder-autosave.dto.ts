import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { SessionStatus } from '../../../entities';

class BuilderMarketingCollateralDto {
  @IsOptional()
  @IsString()
  emailInvite?: string;

  @IsOptional()
  @IsString()
  socialMediaPost?: string;

  @IsOptional()
  @IsString()
  internalAnnouncement?: string;
}

class BuilderReadinessHintsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  missingItems?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suggestions?: string[];
}

class BuilderMetadataTopicDto {
  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsNumber()
  topicId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

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
  @IsString()
  callToAction?: string;

  @IsOptional()
  @IsNumber()
  trainerId?: number;

  @IsOptional()
  @IsString()
  trainerName?: string;

  @IsOptional()
  @IsNumber()
  position?: number;
}

export class BuilderMetadataDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsEnum(SessionStatus)
  sessionStatus?: SessionStatus;

  @IsOptional()
  @IsString()
  desiredOutcome?: string;

  @IsOptional()
  @IsString()
  currentProblem?: string;

  @IsOptional()
  @IsString()
  specificTopics?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsString()
  locationType?: string;

  @IsOptional()
  @IsString()
  meetingPlatform?: string;

  @IsOptional()
  @IsNumber()
  locationCapacity?: number;

  @IsOptional()
  @IsString()
  locationTimezone?: string;

  @IsOptional()
  @IsString()
  locationNotes?: string;

  @IsOptional()
  @IsNumber()
  audienceId?: number;

  @IsOptional()
  @IsString()
  audienceName?: string;

  @IsOptional()
  @IsNumber()
  toneId?: number;

  @IsOptional()
  @IsString()
  toneName?: string;

  @IsOptional()
  @IsNumber()
  marketingToneId?: number;

  @IsOptional()
  @IsString()
  marketingToneName?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BuilderMetadataTopicDto)
  topics?: BuilderMetadataTopicDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BuilderMarketingCollateralDto)
  marketingCollateral?: BuilderMarketingCollateralDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BuilderReadinessHintsDto)
  readinessHints?: BuilderReadinessHintsDto;

  @IsOptional()
  @IsString()
  sessionType?: string;

  @IsOptional()
  @IsString()
  selectedVariantId?: string;

  @IsOptional()
  @IsBoolean()
  autosaveEnabled?: boolean;
}

export class BuilderAutosaveDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => BuilderMetadataDto)
  metadata?: BuilderMetadataDto;

  @IsObject()
  outline: Record<string, unknown> | null;

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
