import { IsNotEmpty, IsOptional, IsString, MaxLength, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLocationDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  capacity?: number;
}