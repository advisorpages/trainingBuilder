import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class IntegrateAIContentDto {
  @IsOptional()
  @IsString()
  selectedHeadline?: string;

  @IsOptional()
  @IsString()
  selectedDescription?: string;

  @IsOptional()
  @IsString()
  selectedKeyBenefits?: string;

  @IsOptional()
  @IsString()
  selectedCallToAction?: string;

  @IsOptional()
  @IsString()
  selectedSocialMedia?: string;

  @IsOptional()
  @IsString()
  selectedEmailCopy?: string;

  @IsOptional()
  @IsBoolean()
  overrideExistingTitle?: boolean;

  @IsOptional()
  @IsBoolean()
  overrideExistingDescription?: boolean;

  @IsOptional()
  @IsBoolean()
  preserveAIContent?: boolean;
}