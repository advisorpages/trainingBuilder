import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSavedVariantDto {
  @ApiPropertyOptional({
    description: 'Updated title',
    example: 'Advanced Leadership Communication',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated description',
    example: 'An advanced session on strategic leadership communication',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated tags for organization',
    example: ['leadership', 'communication', 'advanced', 'strategy'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Updated collection name',
    example: 'Advanced Leadership Series',
  })
  @IsOptional()
  @IsString()
  collectionName?: string;

  @ApiPropertyOptional({
    description: 'Whether this variant is marked as favorite',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional({
    description: 'Updated order within collection',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}