import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { SessionStatus } from '../../../entities/session.entity';

export class ImportSessionItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsNumber()
  readinessScore?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
  locationId?: number;

  @IsOptional()
  @IsInt()
  audienceId?: number;

  @IsOptional()
  @IsInt()
  toneId?: number;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;
}

export class ImportSessionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ImportSessionItemDto)
  sessions!: ImportSessionItemDto[];
}
