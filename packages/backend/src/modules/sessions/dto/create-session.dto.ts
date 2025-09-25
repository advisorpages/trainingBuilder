import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { SessionStatus } from '../../../entities';

export class CreateSessionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  topicId?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  incentiveIds?: string[];

  @IsOptional()
  @IsISO8601()
  startTime?: string;

  @IsOptional()
  @IsISO8601()
  endTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  locationId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  audienceId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  toneId?: number;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  readinessScore?: number;
}
