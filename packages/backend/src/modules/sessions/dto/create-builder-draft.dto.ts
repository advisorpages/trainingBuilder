import { PartialType } from '@nestjs/mapped-types';
import { BuilderAutosaveDto } from './builder-autosave.dto';

export class CreateBuilderDraftDto extends PartialType(BuilderAutosaveDto) {}

