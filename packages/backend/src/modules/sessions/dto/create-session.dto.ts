import { IsNotEmpty, IsString, MaxLength, IsDateString, IsOptional, IsInt, Min, IsArray } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  startTime: Date;

  @IsNotEmpty()
  @IsDateString()
  endTime: Date;

  @IsOptional()
  @IsInt()
  locationId?: number;

  @IsOptional()
  @IsInt()
  trainerId?: number;

  @IsOptional()
  @IsInt()
  audienceId?: number;

  @IsOptional()
  @IsInt()
  toneId?: number;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  topicIds?: number[];

  @IsInt()
  @Min(1)
  maxRegistrations: number = 50;
}