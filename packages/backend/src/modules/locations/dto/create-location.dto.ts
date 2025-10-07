import { IsString, IsOptional, IsNotEmpty, MaxLength, IsEnum, IsInt, Min, IsBoolean } from 'class-validator';
import { LocationType, MeetingPlatform } from '../../../entities/location.entity';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(LocationType)
  @IsNotEmpty()
  locationType: LocationType;

  // Physical location fields
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  // Virtual meeting fields
  @IsEnum(MeetingPlatform)
  @IsOptional()
  meetingPlatform?: MeetingPlatform;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  meetingLink?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  meetingId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  meetingPassword?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  dialInNumber?: string;

  // Common fields
  @IsString()
  @IsOptional()
  @MaxLength(100)
  timezone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  accessInstructions?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
