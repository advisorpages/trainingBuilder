import { IsOptional, IsBoolean, IsString, MaxLength, IsEmail } from 'class-validator';

export class UpdateTrainerDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}