import { PartialType } from '@nestjs/mapped-types';
import { CreateToneDto } from './create-tone.dto';

export class UpdateToneDto extends PartialType(CreateToneDto) {}