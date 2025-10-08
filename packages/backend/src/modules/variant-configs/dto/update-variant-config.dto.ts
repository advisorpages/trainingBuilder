import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateVariantConfigDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instruction?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
