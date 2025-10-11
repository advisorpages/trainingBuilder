import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddOutlineSectionDto {
  @IsString()
  @IsNotEmpty()
  sectionType!: string;

  @IsOptional()
  @IsNumber()
  position?: number;
}

export class UpdateOutlineSectionDto {
  @IsString()
  @IsNotEmpty()
  sectionId!: string;

  @IsNotEmpty()
  updates!: Record<string, unknown>;
}

export class RemoveOutlineSectionDto {
  @IsString()
  @IsNotEmpty()
  sectionId!: string;
}

export class ReorderOutlineSectionsDto {
  @IsArray()
  @IsString({ each: true })
  sectionIds!: string[];
}

export class DuplicateOutlineSectionDto {
  @IsString()
  @IsNotEmpty()
  sectionId!: string;
}
