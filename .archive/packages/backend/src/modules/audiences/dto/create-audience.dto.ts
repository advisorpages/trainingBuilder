import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateAudienceDto {
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  isActive?: boolean = true;
}