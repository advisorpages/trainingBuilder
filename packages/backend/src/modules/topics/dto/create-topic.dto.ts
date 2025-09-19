import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateTopicDto {
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  isActive?: boolean = true;
}