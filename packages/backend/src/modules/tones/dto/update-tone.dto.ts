import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateToneDto } from './create-tone.dto';

export class UpdateToneDto extends PartialType(CreateToneDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
