import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PersonalizedNameType } from '../../../entities/personalized-name.entity';

export class CreatePersonalizedNameDto {
  @IsEnum(PersonalizedNameType)
  type: PersonalizedNameType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  customLabel?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}