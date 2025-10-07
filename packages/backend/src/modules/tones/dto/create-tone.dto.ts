import { IsString, IsOptional, IsNotEmpty, MaxLength, IsEnum, IsInt, Min, Max, IsArray } from 'class-validator';
import { ToneStyle, ToneEnergyLevel, ToneSentenceStructure } from '../../../entities/tone.entity';

export class CreateToneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(ToneStyle)
  @IsOptional()
  style?: ToneStyle;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  formality?: number;

  @IsEnum(ToneEnergyLevel)
  @IsOptional()
  energyLevel?: ToneEnergyLevel;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languageCharacteristics?: string[];

  @IsEnum(ToneSentenceStructure)
  @IsOptional()
  sentenceStructure?: ToneSentenceStructure;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  emotionalResonance?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  examplePhrases?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  promptInstructions?: string;
}
