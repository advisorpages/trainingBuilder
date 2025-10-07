import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateAudienceDto } from './create-audience.dto';

export class UpdateAudienceDto extends PartialType(CreateAudienceDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
