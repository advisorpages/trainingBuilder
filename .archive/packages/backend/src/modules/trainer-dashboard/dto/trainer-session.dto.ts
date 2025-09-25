import { IsUUID, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class TrainerSessionQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  days?: number = 7; // Default to 7 days ahead

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  trainerId?: string;
}

export class CoachingTipGenerationDto {
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsString()
  focusArea?: string;

  @IsOptional()
  @IsString()
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export class CoachingTipCurationDto {
  @IsUUID()
  sessionCoachingTipId: string;

  @IsString()
  status: 'generated' | 'curated' | 'archived';

  @IsOptional()
  @IsString()
  notes?: string;
}