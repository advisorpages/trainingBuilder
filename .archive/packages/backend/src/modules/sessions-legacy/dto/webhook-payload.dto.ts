import { IsString, IsUUID, IsEmail, IsOptional, IsDateString, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SessionDetailsDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class WebhookPayloadDto {
  @IsUUID()
  session_id: string;

  @IsUUID()
  registration_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  referred_by?: string;

  @ValidateNested()
  @Type(() => SessionDetailsDto)
  session_details: SessionDetailsDto;

  @IsDateString()
  registration_timestamp: string;
}

export class WebhookResponseDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  registration_id?: string;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  message?: string;
}