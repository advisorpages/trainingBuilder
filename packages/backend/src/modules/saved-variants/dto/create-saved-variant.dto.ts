import { IsString, IsOptional, IsNumber, IsArray, IsEnum, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GenerationSource {
  RAG = 'rag',
  BASELINE = 'baseline',
  AI = 'ai',
}

export class CreateSavedVariantDto {
  @ApiProperty({
    description: 'The original variant ID from generation',
    example: 'variant-12345',
  })
  @IsString()
  variantId: string;

  @ApiProperty({
    description: 'The complete session outline data',
    example: {
      suggestedSessionTitle: 'Leadership Communication Skills',
      sections: [
        {
          title: 'Introduction',
          duration: 15,
          description: 'Welcome and objectives',
        },
      ],
      totalDuration: 60,
    },
  })
  @IsObject()
  outline: any;

  @ApiProperty({
    description: 'Display title for the saved variant',
    example: 'Leadership Communication Skills',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'A comprehensive session on effective leadership communication',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: '1',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Session type',
    example: 'workshop',
  })
  @IsOptional()
  @IsString()
  sessionType?: string;

  @ApiPropertyOptional({
    description: 'Total duration in minutes',
    example: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalDuration?: number;

  @ApiPropertyOptional({
    description: 'RAG weight (0-1)',
    example: 0.7,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  ragWeight?: number;

  @ApiPropertyOptional({
    description: 'Number of RAG sources used',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ragSourcesUsed?: number;

  @ApiPropertyOptional({
    description: 'Array of RAG source documents',
    type: [Object],
    example: [
      {
        filename: 'leadership-guide.pdf',
        category: 'best-practices',
        similarity: 0.85,
        excerpt: 'Effective communication is key...',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  ragSources?: any[];

  @ApiPropertyOptional({
    description: 'Generation source type',
    enum: GenerationSource,
    example: GenerationSource.RAG,
  })
  @IsOptional()
  @IsEnum(GenerationSource)
  generationSource?: GenerationSource;

  @ApiProperty({
    description: 'Variant label from generation',
    example: 'Version 1: Balanced Approach',
  })
  @IsString()
  variantLabel: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      ragWeight: 0.7,
      generationTime: '2024-01-15T10:30:00Z',
    },
  })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({
    description: 'User-defined tags for organization',
    example: ['leadership', 'communication', 'essential'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'User-defined collection grouping',
    example: 'Leadership Essentials',
  })
  @IsOptional()
  @IsString()
  collectionName?: string;
}
