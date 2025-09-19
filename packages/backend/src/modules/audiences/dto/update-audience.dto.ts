import { PartialType } from '@nestjs/mapped-types';
import { CreateAudienceDto } from './create-audience.dto';

export class UpdateAudienceDto extends PartialType(CreateAudienceDto) {}