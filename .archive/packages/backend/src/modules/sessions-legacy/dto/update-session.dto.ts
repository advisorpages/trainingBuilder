import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsIn, IsString, IsObject } from 'class-validator';
import { CreateSessionDto } from './create-session.dto';
import { SessionStatus } from '../../../entities/session.entity';

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
  @IsOptional()
  @IsIn(Object.values(SessionStatus))
  status?: SessionStatus;

  @IsOptional()
  @IsObject()
  aiGeneratedContent?: object;

  @IsOptional()
  @IsString()
  promotionalHeadline?: string;

  @IsOptional()
  @IsString()
  promotionalSummary?: string;

  @IsOptional()
  @IsString()
  keyBenefits?: string;

  @IsOptional()
  @IsString()
  callToAction?: string;

  @IsOptional()
  @IsString()
  socialMediaContent?: string;

  @IsOptional()
  @IsString()
  emailMarketingContent?: string;
}