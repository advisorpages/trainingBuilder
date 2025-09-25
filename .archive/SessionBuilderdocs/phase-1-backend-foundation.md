# Phase 1: Backend Foundation - Session Builder

## 🎯 **PHASE SCOPE**
Create the foundational backend services and interfaces for the session builder feature. This phase focuses on RAG integration, core data structures, and enhanced topic services.

## ⚠️ **DO NOT TOUCH - EXISTING FILES**
- `packages/backend/src/modules/sessions/sessions.controller.ts`
- `packages/backend/src/modules/sessions/sessions.service.ts`
- `packages/backend/src/modules/ai/ai.service.ts` (only ADD new methods)
- `packages/backend/src/modules/topics/topics.service.ts` (only ADD new methods)
- Any existing entity files
- Any existing DTO files

## 📁 **NEW FILES TO CREATE**

### 1. RAG Integration Service
**File**: `packages/backend/src/services/rag-integration.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface RAGSuggestion {
  content: string;
  score: number;
  source: string;
}

export interface RAGResponse {
  answer: string;
  sources: RAGSuggestion[];
  success: boolean;
}

@Injectable()
export class RAGIntegrationService {
  private readonly logger = new Logger(RAGIntegrationService.name);
  private readonly ragBaseUrl = 'http://100.103.129.72:3000';

  constructor(private readonly httpService: HttpService) {}

  async queryRAGForSessionSuggestions(
    category: string,
    keywords: string[] = [],
    specificTopics: string = ''
  ): Promise<RAGResponse | null> {
    try {
      const isAvailable = await this.isRAGAvailable();
      if (!isAvailable) {
        this.logger.warn('RAG service is not available, will fallback to database topics');
        return null;
      }

      // Construct query for session building context
      const query = this.buildSessionQuery(category, keywords, specificTopics);

      const response = await firstValueFrom(
        this.httpService.post(`${this.ragBaseUrl}/api/chat`,
          new URLSearchParams({ query }),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000, // 10 second timeout
          }
        )
      );

      return {
        answer: response.data.answer || '',
        sources: response.data.sources || [],
        success: true
      };
    } catch (error) {
      this.logger.error('RAG query failed:', error.message);
      return null;
    }
  }

  async isRAGAvailable(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.ragBaseUrl}/api/health`, {
          timeout: 3000, // 3 second timeout for health check
        })
      );
      return response.status === 200;
    } catch (error) {
      this.logger.warn('RAG health check failed:', error.message);
      return false;
    }
  }

  private buildSessionQuery(category: string, keywords: string[], specificTopics: string): string {
    const parts = [
      `Category: ${category}`,
      keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : '',
      specificTopics ? `Specific topics to cover: ${specificTopics}` : '',
      'Please suggest relevant training content, topics, and ideas for a financial services training session.'
    ].filter(Boolean);

    return parts.join('. ');
  }
}
```

### 2. Session Outline Interfaces
**File**: `packages/backend/src/modules/sessions/interfaces/session-outline.interface.ts`

```typescript
export interface SessionOutlineSection {
  title: string;
  duration: number; // duration in minutes
  description: string;
}

export interface TopicSection extends SessionOutlineSection {
  learningObjectives: string[];
  suggestedActivities?: string[];
  materialsNeeded?: string[];
}

export interface ExerciseTopicSection extends TopicSection {
  exerciseDescription: string;
  engagementType: 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play';
}

export interface InspirationSection {
  title: string;
  duration: number;
  type: 'video' | 'story' | 'quote' | 'case-study';
  suggestions: string[];
  description?: string;
}

export interface ClosingSection extends SessionOutlineSection {
  keyTakeaways: string[];
  actionItems: string[];
  nextSteps?: string[];
}

export interface SessionOutline {
  // Session structure following the specified format
  opener: SessionOutlineSection;
  topic1: TopicSection;
  topic2: ExerciseTopicSection;
  inspirationalContent: InspirationSection;
  closing: ClosingSection;

  // Metadata
  totalDuration: number;
  suggestedSessionTitle: string;
  suggestedDescription: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  recommendedAudienceSize: string;

  // RAG enhancement data
  ragSuggestions?: any;
  fallbackUsed: boolean; // true if RAG was unavailable
  generatedAt: Date;
}
```

### 3. Session Builder DTOs
**File**: `packages/backend/src/modules/sessions/dto/session-builder.dto.ts`

```typescript
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SessionType {
  EVENT = 'event',
  TRAINING = 'training',
  WORKSHOP = 'workshop',
  WEBINAR = 'webinar'
}

export class SuggestSessionOutlineDto {
  @IsString()
  category: string;

  @IsEnum(SessionType)
  sessionType: SessionType;

  @IsString()
  desiredOutcome: string;

  @IsOptional()
  @IsString()
  currentProblem?: string;

  @IsOptional()
  @IsString()
  specificTopics?: string;

  @IsDateString()
  date: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  locationId?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  audienceId?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  toneId?: number;
}

export class SessionOutlineResponseDto {
  outline: any; // Will be SessionOutline interface
  relevantTopics: any[]; // Will be Topic entities
  ragAvailable: boolean;
  ragSuggestions?: any;
  generationMetadata: {
    processingTime: number;
    ragQueried: boolean;
    fallbackUsed: boolean;
    topicsFound: number;
  };
}
```

### 4. Enhanced Topics Service Methods
**File**: `packages/backend/src/modules/topics/topics-enhancement.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../../entities/topic.entity';

@Injectable()
export class TopicsEnhancementService {
  constructor(
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
  ) {}

  async findRelevantTopics(
    categoryId: string,
    keywords: string[] = [],
    limit: number = 10
  ): Promise<Topic[]> {
    const queryBuilder = this.topicsRepository.createQueryBuilder('topic');

    // Filter by category if provided
    if (categoryId && categoryId !== 'all') {
      // Note: This assumes topics have a category relationship
      // Adjust based on your actual Topic entity structure
      queryBuilder.leftJoin('topic.category', 'category');
      queryBuilder.where('category.id = :categoryId', { categoryId });
    }

    // Add keyword search if provided
    if (keywords.length > 0) {
      const keywordConditions = keywords.map((_, index) =>
        `topic.name ILIKE :keyword${index} OR topic.description ILIKE :keyword${index}`
      ).join(' OR ');

      queryBuilder.andWhere(`(${keywordConditions})`);

      // Add parameters for each keyword
      keywords.forEach((keyword, index) => {
        queryBuilder.setParameter(`keyword${index}`, `%${keyword}%`);
      });
    }

    queryBuilder
      .andWhere('topic.isActive = :isActive', { isActive: true })
      .orderBy('topic.name', 'ASC')
      .limit(limit);

    return await queryBuilder.getMany();
  }

  async findTopicsByCategory(categoryId: string): Promise<Topic[]> {
    if (!categoryId || categoryId === 'all') {
      return this.topicsRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
        take: 20
      });
    }

    // Adjust this query based on your actual relationship structure
    return this.topicsRepository
      .createQueryBuilder('topic')
      .leftJoin('topic.sessions', 'session')
      .leftJoin('session.category', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('topic.isActive = :isActive', { isActive: true })
      .orderBy('topic.name', 'ASC')
      .limit(20)
      .getMany();
  }

  async extractKeywordsFromText(text: string): Promise<string[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Simple keyword extraction - remove common words and extract meaningful terms
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'is', 'are', 'was', 'were', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'how', 'what', 'when', 'where', 'why', 'who'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }
}
```

### 5. AI Prompt Template
**File**: `config/ai-prompts/session-outline-generator.md`

```markdown
---
id: session-outline-generator
name: Session Outline Generator
description: Generate structured training session outlines for financial services
category: session-planning
variables: [category, sessionType, desiredOutcome, currentProblem, specificTopics, duration, relevantTopics, ragSuggestions]
---

You are an expert training designer for financial services. Create a comprehensive session outline based on the following requirements:

**Session Details:**
- Category: {category}
- Type: {sessionType}
- Duration: {duration} minutes
- Desired Outcome: {desiredOutcome}
{currentProblem ? `- Problem to Address: ${currentProblem}` : ''}
{specificTopics ? `- Specific Topics Requested: ${specificTopics}` : ''}

**Available Resources:**
{relevantTopics ? `- Existing Topics: ${relevantTopics}` : ''}
{ragSuggestions ? `- Content Suggestions: ${ragSuggestions}` : ''}

**Required Session Structure:**
1. **Opener (10-15 minutes)**: Icebreaker and objective setting
2. **Topic 1 (30 minutes)**: Main learning content with discussion
3. **Topic 2 (30 minutes)**: Interactive exercise to strengthen the main topic and engage the group
4. **Inspirational Content (10 minutes)**: Video, story, or motivational element
5. **Closing (20 minutes)**: Summary, key takeaways, and action planning

Please generate a detailed outline that:
- Uses engaging, professional language appropriate for financial services
- Includes specific learning objectives for each topic
- Suggests interactive activities and exercises
- Provides clear takeaways and action items
- Incorporates the available resources when relevant
- Addresses the stated desired outcome

Format your response as a structured outline with clear sections, bullet points, and specific time allocations.
```

## 🔧 **MODULE REGISTRATION**

### Update App Module
**File**: `packages/backend/src/app.module.ts`
**Action**: ADD these imports (do not remove existing ones)

```typescript
// Add these imports at the top
import { RAGIntegrationService } from './services/rag-integration.service';
import { TopicsEnhancementService } from './modules/topics/topics-enhancement.service';

// Add to providers array (keep existing providers)
providers: [
  // ... existing providers
  RAGIntegrationService,
  TopicsEnhancementService,
],
```

### Update Topics Module
**File**: `packages/backend/src/modules/topics/topics.module.ts`
**Action**: ADD TopicsEnhancementService to providers and exports

```typescript
// Add import
import { TopicsEnhancementService } from './topics-enhancement.service';

// Update providers and exports arrays
providers: [TopicsService, TopicsEnhancementService],
exports: [TopicsService, TopicsEnhancementService],
```

## ✅ **TESTING PHASE 1**

### 1. Build Test
```bash
cd packages/backend
npm run build
```

### 2. RAG Service Test
Create a simple test endpoint in any controller to verify RAG integration:
```typescript
@Get('test-rag')
async testRAG() {
  const ragService = new RAGIntegrationService(this.httpService);
  const result = await ragService.queryRAGForSessionSuggestions('Leadership', ['motivation'], 'team building');
  return { ragAvailable: !!result, result };
}
```

### 3. Topics Enhancement Test
Test that enhanced topics service can find relevant topics by category.

## 🎯 **SUCCESS CRITERIA**

- ✅ RAG service can connect to external RAG API
- ✅ RAG service gracefully handles failures
- ✅ Session outline interfaces are properly defined
- ✅ DTOs validate input correctly
- ✅ Topics enhancement service finds relevant topics
- ✅ AI prompt template is available
- ✅ All new services are properly registered
- ✅ Backend builds without errors
- ✅ No existing functionality is broken

## 📌 **NEXT PHASE DEPENDENCIES**

Phase 2 will build on these foundation services to create the actual API endpoints and integrate with the AI service for outline generation.

## 🚨 **IMPORTANT NOTES**

- DO NOT modify any existing controller methods
- DO NOT change existing entity relationships
- ALL new code should be additive only
- Test RAG connectivity before proceeding to Phase 2
- Ensure all TypeScript interfaces are properly exported
- Verify that existing topics API still works unchanged