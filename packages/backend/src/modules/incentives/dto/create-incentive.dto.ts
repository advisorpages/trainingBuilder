import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateIncentiveDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
