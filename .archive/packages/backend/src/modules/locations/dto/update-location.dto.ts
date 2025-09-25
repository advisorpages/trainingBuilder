import { IsOptional, IsBoolean, IsString, MaxLength, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}