import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ContentSource, SessionContentKind } from '../../../entities';

export class CreateContentVersionDto {
  @IsEnum(SessionContentKind)
  kind: SessionContentKind;

  @IsEnum(ContentSource)
  source: ContentSource;

  @IsObject()
  content: Record<string, unknown>;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  promptVariables?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  generatedAt?: Date;
}
