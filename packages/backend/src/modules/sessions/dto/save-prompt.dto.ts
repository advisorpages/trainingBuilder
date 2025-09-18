import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class SavePromptDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(10000)
  prompt: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  templateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  templateName?: string;
}