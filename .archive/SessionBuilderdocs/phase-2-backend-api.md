# Phase 2: Backend API Layer - Session Builder

## 🎯 **PHASE SCOPE**
Create the API endpoints and AI service enhancements for session outline generation. This phase builds on Phase 1 foundations to create the core backend functionality.

## ⚠️ **PREREQUISITES**
- ✅ Phase 1 must be completed successfully
- ✅ RAG Integration Service is working
- ✅ Session outline interfaces are defined
- ✅ Topics Enhancement Service is functional

## ⚠️ **DO NOT TOUCH - EXISTING FILES**
- `packages/backend/src/modules/sessions/sessions.service.ts` (DO NOT MODIFY existing methods)
- `packages/backend/src/modules/ai/ai.service.ts` (ONLY ADD new methods, don't change existing)
- Any existing entity files
- Any existing migrations
- Existing session endpoints functionality

## 📁 **FILES TO MODIFY/CREATE**

### 1. Add New Methods to AI Service
**File**: `packages/backend/src/modules/ai/ai.service.ts`
**Action**: ADD these methods to the existing class (DO NOT modify existing methods)

```typescript
// ADD these imports at the top (keep existing imports)
import { SessionOutline, SessionOutlineSection, TopicSection, ExerciseTopicSection, InspirationSection, ClosingSection } from '../sessions/interfaces/session-outline.interface';
import { SuggestSessionOutlineDto } from '../sessions/dto/session-builder.dto';
import { Topic } from '../../entities/topic.entity';

// ADD these methods to the existing AIService class
async generateSessionOutline(
  request: SuggestSessionOutlineDto,
  relevantTopics: Topic[] = [],
  ragSuggestions?: any
): Promise<SessionOutline> {
  try {
    // Calculate session duration
    const startTime = new Date(request.startTime);
    const endTime = new Date(request.endTime);
    const totalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Prepare context for AI prompt
    const promptContext = {
      category: request.category,
      sessionType: request.sessionType,
      desiredOutcome: request.desiredOutcome,
      currentProblem: request.currentProblem || '',
      specificTopics: request.specificTopics || '',
      duration: totalDuration,
      relevantTopics: relevantTopics.map(t => `${t.name}: ${t.description || ''}`).join('; '),
      ragSuggestions: ragSuggestions ? this.formatRAGSuggestions(ragSuggestions) : ''
    };

    // Get the session outline template
    const template = await this.getTemplate('session-outline-generator');
    if (!template) {
      throw new BadRequestException('Session outline template not found');
    }

    // Generate AI prompt
    const prompt = this.populateTemplate(template.template, promptContext);

    // For now, generate a structured outline based on the requirements
    // In production, this would call OpenAI API
    const outline = this.generateStructuredOutline(request, totalDuration, relevantTopics, ragSuggestions);

    return outline;
  } catch (error) {
    console.error('Error generating session outline:', error);
    throw new InternalServerErrorException('Failed to generate session outline');
  }
}

private formatRAGSuggestions(ragSuggestions: any): string {
  if (!ragSuggestions || !ragSuggestions.sources) {
    return '';
  }

  return ragSuggestions.sources
    .slice(0, 5) // Top 5 suggestions
    .map((source: any, index: number) => `${index + 1}. ${source.text || source.content || ''}`)
    .join('\n');
}

private populateTemplate(template: string, context: any): string {
  let populatedTemplate = template;

  Object.entries(context).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    populatedTemplate = populatedTemplate.replace(regex, String(value || ''));
  });

  return populatedTemplate;
}

private generateStructuredOutline(
  request: SuggestSessionOutlineDto,
  totalDuration: number,
  relevantTopics: Topic[],
  ragSuggestions?: any
): SessionOutline {
  // Generate opener section
  const opener: SessionOutlineSection = {
    title: `Welcome & ${request.category} Session Introduction`,
    duration: 15,
    description: `Welcome participants and establish the session's objectives. Brief icebreaker activity to engage the group and set expectations for the ${request.sessionType}.`
  };

  // Generate main topic 1
  const topic1: TopicSection = {
    title: this.generateTopicTitle(request.category, request.specificTopics, relevantTopics, 1),
    duration: 30,
    description: this.generateTopicDescription(request.category, request.desiredOutcome, relevantTopics, ragSuggestions),
    learningObjectives: this.generateLearningObjectives(request.category, request.desiredOutcome),
    suggestedActivities: ['Group discussion', 'Case study review', 'Q&A session'],
    materialsNeeded: ['Presentation slides', 'Handouts', 'Flip chart paper']
  };

  // Generate exercise topic 2
  const topic2: ExerciseTopicSection = {
    title: this.generateTopicTitle(request.category, request.specificTopics, relevantTopics, 2),
    duration: 30,
    description: `Interactive exercise designed to reinforce ${request.category} concepts through hands-on practice and group engagement.`,
    learningObjectives: [`Apply ${request.category} principles in practical scenarios`, 'Develop confidence through practice', 'Learn from peer interactions'],
    exerciseDescription: this.generateExerciseDescription(request.category, request.sessionType),
    engagementType: this.selectEngagementType(request.sessionType),
    suggestedActivities: ['Role-playing exercise', 'Small group breakouts', 'Peer feedback sessions'],
    materialsNeeded: ['Exercise worksheets', 'Timer', 'Name tags for roles']
  };

  // Generate inspirational content
  const inspirationalContent: InspirationSection = {
    title: 'Inspiration & Motivation',
    duration: 10,
    type: 'video',
    suggestions: this.generateInspirationSuggestions(request.category),
    description: `Motivational content to inspire participants and reinforce the importance of ${request.category} in their professional development.`
  };

  // Generate closing section
  const closing: ClosingSection = {
    title: 'Wrap-up & Action Planning',
    duration: 20,
    description: 'Summarize key learnings, establish action items, and ensure participants leave with clear next steps.',
    keyTakeaways: this.generateKeyTakeaways(request.category, request.desiredOutcome),
    actionItems: this.generateActionItems(request.category, request.desiredOutcome),
    nextSteps: ['Schedule follow-up check-ins', 'Access additional resources', 'Apply learnings in daily work']
  };

  return {
    opener,
    topic1,
    topic2,
    inspirationalContent,
    closing,
    totalDuration,
    suggestedSessionTitle: this.generateSessionTitle(request.category, request.sessionType, request.desiredOutcome),
    suggestedDescription: this.generateSessionDescription(request.category, request.sessionType, request.desiredOutcome),
    difficulty: this.determineDifficulty(request.sessionType, relevantTopics.length),
    recommendedAudienceSize: this.getRecommendedAudienceSize(request.sessionType),
    ragSuggestions: ragSuggestions || null,
    fallbackUsed: !ragSuggestions,
    generatedAt: new Date()
  };
}

private generateTopicTitle(category: string, specificTopics: string = '', relevantTopics: Topic[], topicNumber: number): string {
  if (specificTopics && topicNumber === 1) {
    return `Core ${category}: ${specificTopics.split(',')[0]?.trim() || 'Fundamentals'}`;
  }

  if (relevantTopics.length > 0 && topicNumber <= relevantTopics.length) {
    return relevantTopics[topicNumber - 1].name;
  }

  const defaultTopics = {
    1: `${category} Foundations`,
    2: `${category} Application & Practice`
  };

  return defaultTopics[topicNumber as keyof typeof defaultTopics] || `${category} Topic ${topicNumber}`;
}

private generateTopicDescription(category: string, desiredOutcome: string, relevantTopics: Topic[], ragSuggestions?: any): string {
  let description = `Comprehensive exploration of ${category} principles and practices. `;

  if (desiredOutcome) {
    description += `This topic directly supports the goal of ${desiredOutcome.toLowerCase()}. `;
  }

  if (relevantTopics.length > 0) {
    description += `Drawing from proven methodologies including ${relevantTopics.slice(0, 2).map(t => t.name).join(' and ')}. `;
  }

  description += 'Participants will engage in interactive discussions and practical applications.';

  return description;
}

private generateLearningObjectives(category: string, desiredOutcome: string): string[] {
  return [
    `Understand core ${category} principles and their practical applications`,
    `Identify key strategies for ${desiredOutcome.toLowerCase() || 'professional success'}`,
    `Develop confidence in applying ${category} skills in real-world scenarios`,
    'Build a personal action plan for continued growth'
  ];
}

private generateExerciseDescription(category: string, sessionType: string): string {
  const exerciseTypes = {
    workshop: `Hands-on ${category} simulation with real-world scenarios`,
    training: `Structured practice session with guided ${category} application`,
    webinar: `Interactive breakout sessions focusing on ${category} implementation`,
    event: `Collaborative ${category} challenge with peer learning opportunities`
  };

  return exerciseTypes[sessionType as keyof typeof exerciseTypes] || `Interactive ${category} exercise`;
}

private selectEngagementType(sessionType: string): 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play' {
  const engagementMap = {
    workshop: 'workshop' as const,
    training: 'activity' as const,
    webinar: 'discussion' as const,
    event: 'case-study' as const
  };

  return engagementMap[sessionType as keyof typeof engagementMap] || 'activity';
}

private generateInspirationSuggestions(category: string): string[] {
  return [
    `"The Power of ${category}" - Industry success stories`,
    `"Transforming Teams Through ${category}" - Leadership insights`,
    `"Real-World ${category} Champions" - Client testimonials`,
    `"Future of ${category}" - Innovation and trends`,
    `"Personal ${category} Journey" - Motivational speaker`
  ];
}

private generateKeyTakeaways(category: string, desiredOutcome: string): string[] {
  return [
    `${category} is essential for ${desiredOutcome.toLowerCase() || 'professional success'}`,
    'Practical tools and strategies can be implemented immediately',
    'Continuous learning and practice drive mastery',
    'Peer collaboration enhances individual growth',
    'Personal commitment is key to achieving lasting change'
  ];
}

private generateActionItems(category: string, desiredOutcome: string): string[] {
  return [
    `Identify one ${category} skill to practice this week`,
    `Schedule time for daily ${category} application`,
    'Find an accountability partner for ongoing support',
    `Set specific goals related to ${desiredOutcome.toLowerCase() || 'skill development'}`,
    'Plan follow-up learning activities and resources'
  ];
}

private generateSessionTitle(category: string, sessionType: string, desiredOutcome: string): string {
  const typeModifiers = {
    workshop: 'Interactive',
    training: 'Comprehensive',
    webinar: 'Virtual',
    event: 'Special'
  };

  const modifier = typeModifiers[sessionType as keyof typeof typeModifiers] || 'Professional';
  return `${modifier} ${category} ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}: ${desiredOutcome}`;
}

private generateSessionDescription(category: string, sessionType: string, desiredOutcome: string): string {
  return `Join us for this engaging ${sessionType} focused on ${category} development. Designed to help participants ${desiredOutcome.toLowerCase()}, this session combines expert instruction with practical application. Participants will leave with actionable strategies and increased confidence in their ${category.toLowerCase()} capabilities.`;
}

private determineDifficulty(sessionType: string, topicCount: number): 'beginner' | 'intermediate' | 'advanced' {
  if (sessionType === 'event' || topicCount <= 2) return 'beginner';
  if (sessionType === 'workshop' || topicCount > 5) return 'advanced';
  return 'intermediate';
}

private getRecommendedAudienceSize(sessionType: string): string {
  const sizeRecommendations = {
    workshop: '8-12 participants for optimal interaction',
    training: '12-20 participants for effective learning',
    webinar: '20-50 participants for broad reach',
    event: '15-30 participants for networking opportunities'
  };

  return sizeRecommendations[sessionType as keyof typeof sizeRecommendations] || '10-25 participants';
}
```

### 2. Create Session Builder Controller
**File**: `packages/backend/src/modules/sessions/controllers/session-builder.controller.ts`

```typescript
import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { SessionBuilderService } from '../services/session-builder.service';
import { SuggestSessionOutlineDto, SessionOutlineResponseDto } from '../dto/session-builder.dto';

@Controller('sessions/builder')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
export class SessionBuilderController {
  constructor(
    private readonly sessionBuilderService: SessionBuilderService
  ) {}

  @Post('suggest-outline')
  async suggestOutline(
    @Body() suggestOutlineDto: SuggestSessionOutlineDto
  ): Promise<SessionOutlineResponseDto> {
    const startTime = Date.now();

    const result = await this.sessionBuilderService.generateSessionOutline(suggestOutlineDto);

    return {
      outline: result.outline,
      relevantTopics: result.relevantTopics,
      ragAvailable: result.ragAvailable,
      ragSuggestions: result.ragSuggestions,
      generationMetadata: {
        processingTime: Date.now() - startTime,
        ragQueried: result.ragQueried,
        fallbackUsed: result.fallbackUsed,
        topicsFound: result.relevantTopics.length
      }
    };
  }

  @Get('suggestions/:category')
  async getSuggestionsForCategory(
    @Param('category') category: string
  ): Promise<{ topics: any[], ragAvailable: boolean }> {
    return this.sessionBuilderService.getSuggestionsForCategory(category);
  }

  @Post('test-rag')
  async testRAGConnection(): Promise<{ available: boolean, response?: any }> {
    return this.sessionBuilderService.testRAGConnection();
  }
}
```

### 3. Create Session Builder Service
**File**: `packages/backend/src/modules/sessions/services/session-builder.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '../../ai/ai.service';
import { RAGIntegrationService } from '../../../services/rag-integration.service';
import { TopicsEnhancementService } from '../../topics/topics-enhancement.service';
import { CategoriesService } from '../../categories/categories.service';
import { SuggestSessionOutlineDto } from '../dto/session-builder.dto';
import { SessionOutline } from '../interfaces/session-outline.interface';
import { Topic } from '../../../entities/topic.entity';

export interface SessionOutlineResult {
  outline: SessionOutline;
  relevantTopics: Topic[];
  ragAvailable: boolean;
  ragQueried: boolean;
  fallbackUsed: boolean;
  ragSuggestions?: any;
}

@Injectable()
export class SessionBuilderService {
  private readonly logger = new Logger(SessionBuilderService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly ragIntegrationService: RAGIntegrationService,
    private readonly topicsEnhancementService: TopicsEnhancementService,
    private readonly categoriesService: CategoriesService
  ) {}

  async generateSessionOutline(request: SuggestSessionOutlineDto): Promise<SessionOutlineResult> {
    this.logger.log(`Generating session outline for category: ${request.category}, type: ${request.sessionType}`);

    // Step 1: Attempt RAG query
    let ragSuggestions = null;
    let ragQueried = false;
    let ragAvailable = false;

    try {
      ragAvailable = await this.ragIntegrationService.isRAGAvailable();

      if (ragAvailable) {
        ragQueried = true;
        const keywords = await this.extractKeywordsFromRequest(request);
        ragSuggestions = await this.ragIntegrationService.queryRAGForSessionSuggestions(
          request.category,
          keywords,
          request.specificTopics || ''
        );

        if (ragSuggestions) {
          this.logger.log(`RAG query successful, found ${ragSuggestions.sources?.length || 0} sources`);
        }
      }
    } catch (error) {
      this.logger.warn('RAG query failed, falling back to database topics:', error.message);
    }

    // Step 2: Query relevant topics from database
    let relevantTopics: Topic[] = [];
    try {
      const keywords = await this.extractKeywordsFromRequest(request);
      relevantTopics = await this.topicsEnhancementService.findRelevantTopics(
        request.category,
        keywords,
        10
      );

      // If no topics found by category, try broader search
      if (relevantTopics.length === 0) {
        relevantTopics = await this.topicsEnhancementService.findTopicsByCategory(request.category);
      }

      this.logger.log(`Found ${relevantTopics.length} relevant topics from database`);
    } catch (error) {
      this.logger.warn('Failed to query database topics:', error.message);
    }

    // Step 3: Generate session outline using AI
    let outline: SessionOutline;
    try {
      outline = await this.aiService.generateSessionOutline(
        request,
        relevantTopics,
        ragSuggestions
      );

      this.logger.log('Session outline generated successfully');
    } catch (error) {
      this.logger.error('Failed to generate session outline:', error.message);
      throw error;
    }

    return {
      outline,
      relevantTopics,
      ragAvailable,
      ragQueried,
      fallbackUsed: !ragSuggestions && relevantTopics.length === 0,
      ragSuggestions
    };
  }

  async getSuggestionsForCategory(category: string): Promise<{ topics: Topic[], ragAvailable: boolean }> {
    const ragAvailable = await this.ragIntegrationService.isRAGAvailable();
    const topics = await this.topicsEnhancementService.findTopicsByCategory(category);

    return {
      topics,
      ragAvailable
    };
  }

  async testRAGConnection(): Promise<{ available: boolean, response?: any }> {
    try {
      const available = await this.ragIntegrationService.isRAGAvailable();

      if (available) {
        const testResponse = await this.ragIntegrationService.queryRAGForSessionSuggestions(
          'Leadership',
          ['motivation', 'team'],
          'team building and motivation'
        );

        return {
          available: true,
          response: testResponse
        };
      }

      return { available: false };
    } catch (error) {
      return {
        available: false,
        response: { error: error.message }
      };
    }
  }

  private async extractKeywordsFromRequest(request: SuggestSessionOutlineDto): Promise<string[]> {
    const textToAnalyze = [
      request.desiredOutcome,
      request.currentProblem || '',
      request.specificTopics || ''
    ].filter(Boolean).join(' ');

    return this.topicsEnhancementService.extractKeywordsFromText(textToAnalyze);
  }
}
```

### 4. Create Database Migration
**File**: `packages/backend/src/migrations/[timestamp]-AddMarketingKitToSessions.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMarketingKitToSessions1703171200000 implements MigrationInterface {
  name = 'AddMarketingKitToSessions1703171200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('sessions', new TableColumn({
      name: 'marketing_kit_content',
      type: 'text',
      isNullable: true,
      comment: 'Generated marketing kit content for session promotion'
    }));

    await queryRunner.addColumn('sessions', new TableColumn({
      name: 'session_outline_data',
      type: 'jsonb',
      isNullable: true,
      comment: 'Generated session outline data from session builder'
    }));

    await queryRunner.addColumn('sessions', new TableColumn({
      name: 'builder_generated',
      type: 'boolean',
      default: false,
      comment: 'Indicates if session was created using the session builder'
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('sessions', 'marketing_kit_content');
    await queryRunner.dropColumn('sessions', 'session_outline_data');
    await queryRunner.dropColumn('sessions', 'builder_generated');
  }
}
```

### 5. Update Sessions Module
**File**: `packages/backend/src/modules/sessions/sessions.module.ts`
**Action**: ADD imports and providers (keep existing ones)

```typescript
// ADD these imports (keep existing ones)
import { SessionBuilderController } from './controllers/session-builder.controller';
import { SessionBuilderService } from './services/session-builder.service';
import { RAGIntegrationService } from '../../services/rag-integration.service';
import { TopicsEnhancementService } from '../topics/topics-enhancement.service';
import { CategoriesService } from '../categories/categories.service';
import { HttpModule } from '@nestjs/axios';

// UPDATE the module configuration
@Module({
  imports: [
    // ... existing imports
    HttpModule, // Add this for RAG HTTP requests
  ],
  controllers: [
    SessionsController, // existing
    SessionBuilderController, // ADD this
  ],
  providers: [
    SessionsService, // existing
    SessionBuilderService, // ADD this
    RAGIntegrationService, // ADD this
    // ... other existing providers
  ],
  exports: [
    SessionsService, // existing
    SessionBuilderService, // ADD this
  ],
})
```

### 6. Update Session Entity
**File**: `packages/backend/src/entities/session.entity.ts`
**Action**: ADD these new columns (keep all existing columns)

```typescript
// ADD these new columns to the existing Session entity
@Column({ name: 'marketing_kit_content', type: 'text', nullable: true })
@IsOptional()
marketingKitContent?: string;

@Column({ name: 'session_outline_data', type: 'jsonb', nullable: true })
@IsOptional()
sessionOutlineData?: object;

@Column({ name: 'builder_generated', default: false })
builderGenerated: boolean;
```

## ✅ **TESTING PHASE 2**

### 1. Build Test
```bash
cd packages/backend
npm run build
```

### 2. Test New Endpoint
Start the backend and test:
```bash
POST http://localhost:3001/api/sessions/builder/suggest-outline
Content-Type: application/json

{
  "category": "Leadership",
  "sessionType": "training",
  "desiredOutcome": "Improve team motivation and communication",
  "currentProblem": "Team lacks direction",
  "specificTopics": "goal setting, feedback",
  "date": "2024-01-15",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:45:00Z"
}
```

### 3. Test RAG Connection
```bash
POST http://localhost:3001/api/sessions/builder/test-rag
```

### 4. Test Category Suggestions
```bash
GET http://localhost:3001/api/sessions/builder/suggestions/Leadership
```

## 🎯 **SUCCESS CRITERIA**

- ✅ Session outline generation endpoint works
- ✅ RAG integration attempts connection and falls back gracefully
- ✅ Database topics are queried as fallback
- ✅ AI service generates structured session outlines
- ✅ New database columns are added successfully
- ✅ All endpoints return proper error handling
- ✅ Backend builds without errors
- ✅ Existing session functionality remains unchanged

## 📌 **NEXT PHASE DEPENDENCIES**

Phase 3 will create the frontend components that consume these new API endpoints to build the session builder wizard interface.

## 🚨 **IMPORTANT NOTES**

- Test RAG connectivity before marking this phase complete
- Ensure all new endpoints require proper authentication
- Verify that existing session creation still works
- Check that the AI service integration doesn't break existing AI functionality
- Run migration to add new database columns
- All error handling should be comprehensive and user-friendly