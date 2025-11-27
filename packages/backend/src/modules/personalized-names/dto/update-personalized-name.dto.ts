import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonalizedNameDto } from './create-personalized-name.dto';

export class UpdatePersonalizedNameDto extends PartialType(CreatePersonalizedNameDto) {}