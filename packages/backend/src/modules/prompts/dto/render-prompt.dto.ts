import { IsString, IsObject } from 'class-validator';

export class RenderPromptDto {
  @IsString()
  name: string;

  @IsObject()
  variables: Record<string, any>;
}