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
  IsBoolean,
} from 'class-validator';
import { SessionStatus } from '../../../entities/session.entity';
import { ImportTopicItemDto } from '../../topics/dto/import-topics.dto';

export class ImportSessionTopicDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

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
  @IsBoolean()
  isActive?: boolean;
}

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

  // New field for inline topic import
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportSessionTopicDto)
  topics?: ImportSessionTopicDto[];
}

export class ImportSessionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ImportSessionItemDto)
  sessions!: ImportSessionItemDto[];
}

/**
 * Example usage of the enhanced import functionality:
 *
 * POST /sessions/import
 * {
 *   "sessions": [
 *     {
 *       "title": "Advanced React Patterns",
 *       "status": "DRAFT",
 *       "objective": "Learn advanced React patterns and best practices",
 *       "topics": [
 *         {
 *           "name": "React Hooks Deep Dive",
 *           "description": "Comprehensive exploration of React hooks",
 *           "learningOutcomes": "Understand useEffect, useContext, and custom hooks",
 *           "isActive": true
 *         },
 *         {
 *           "id": 123,
 *           "name": "State Management",
 *           "description": "Managing complex state in React applications"
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * This will:
 * 1. Create the "React Hooks Deep Dive" topic if it doesn't exist
 * 2. Update the topic with ID 123 if it exists
 * 3. Create the session and associate it with the first topic
 * 4. Return a summary with both session and topic import results
 *
 * Response format:
 * {
 *   "total": 1,
 *   "created": 1,
 *   "updated": 0,
 *   "errors": [],
 *   "topicsCreated": 1,
 *   "topicsUpdated": 1
 * }
 */
