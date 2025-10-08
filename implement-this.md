# Session Builder v2.0 - Complete MVP Implementation Plan

## Executive Summary

**Goal**: Implement Session Builder v2.0 with RAG-powered multi-variant generation to help brokers and content developers create quality sessions faster.

**MVP Approach**: Focus on 8 high-impact enhancements that prove RAG adds value while ensuring production readiness.

**Timeline**: 4-5 weeks (39-45 hours)
**Risk**: Low (separate endpoint, zero impact to existing flow)
**Key Success Metric**: Do users select RAG variants >50% of the time?

---

## Problems We're Solving

1. **Brokers/content developers** struggle to create relevant session content
2. **Trainers** aren't well prepared (sessions lack depth)
3. **Teams** don't collaborate effectively on session ideas
4. **Participants** don't know what they're showing up for

---

## The 8 Core Enhancements

### **MVP Core (4 enhancements)**
1. ✅ **Smart RAG Context Injection** - Weight by similarity, recency, category match
2. ✅ **Hybrid Generation Strategy** - 4 variants with different RAG weights (80%, 50%, 20%, 0%)
3. ✅ **Smart Variant Labeling** - Clear labels + descriptions for each variant
4. ✅ **Real-Time Duration Balancing** - Auto-adjust sections to target 90 minutes

### **Production Readiness (4 enhancements)**
5. ✅ **Error Handling & Timeouts** - Prevent RAG failures from blocking generation
6. ✅ **Prompt Refinement & Role Anchoring** - Dynamic prompts based on RAG weight
7. ✅ **Telemetry & Analytics** - Track selections to measure success
8. ✅ **Backend & Frontend Observability** - Structured logging for debugging

### **UX Enhancements (Included)**
- 🎨 **Fun Loading Screen** - Live progress feed with engaging messages:
  - 🔎 Looking for your best ideas…
  - 📚 Pulling in the most useful training material…
  - 🧠 Thinking up smart ways to make it shine…
  - ✨ Building Version 1 — powered by your knowledge base!
  - 🎨 Building Version 2 — the perfect mix of old and new!
  - 🚀 Building Version 3 — bold and creative!
  - 🎪 Building Version 4 — a totally fresh approach!
  - 🎉 Done! Your four session ideas are ready to explore!
- 🎴 **Detailed Variant Cards** - Each card shows full section breakdown with:
  - Session title and total duration
  - Every section with title, duration, and description
  - RAG vs AI badge for transparency
  - Scrollable preview (max height for long outlines)
  - Example: "Welcome & Mindset (15 min) — Set the tone for the session..."
- 📚 **Topic Library Browser** - CRUD flexibility + pull from topic table
- ⚙️ **RAG Query Admin** - Editable prompt template for iteration
- 🎯 **Default 90min/4 Segments** - Proven session structure

---

## RAG API Reference

**Documentation**: See `/Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/docs-reference/tribeRAG-API_DOCUMENTATION.md`

**Base URL**: `http://localhost:8000` (configurable via `RAG_API_URL` env var)

### Key Endpoint for Session Builder

**POST** `/search` - Hybrid search combining BM25 + vector similarity

**Request**:
```json
{
  "query": "Training session about prospecting for new advisors focused on increasing appointment rates",
  "filters": {
    "category": "Prospecting",
    "keywords": ["cold calling", "appointment setting"]
  }
}
```

**Response**:
```json
{
  "hits": [
    {
      "doc_id": "doc_123",
      "chunk_id": "chunk_001",
      "score": 0.875,
      "snippet": "Effective prospecting begins with...",
      "path": "prospecting/doc_123/v1/chunks/chunk_001.json"
    }
  ]
}
```

**Scoring**: 0.0 to 1.0, combining BM25 + vector similarity + recency boost

---

## Technical Architecture

### New Endpoint Strategy
- **Keep**: `POST /sessions/builder/suggest-outline` (existing, single variant)
- **New**: `POST /sessions/builder/suggest-outline-v2` (4 variants with RAG)
- Frontend routes to v2 when ready
- **Zero risk** to existing users

### Environment Variables
```bash
# Add to .env
RAG_API_URL=http://localhost:8000

# RAG Scoring (optional, for future tuning)
RAG_SIMILARITY_WEIGHT=0.5
RAG_RECENCY_WEIGHT=0.2
RAG_CATEGORY_WEIGHT=0.2
RAG_BASE_WEIGHT=0.1
RAG_SIMILARITY_THRESHOLD=0.65
```

### Outline Editing & Draft Sync (Added)
- Builder now creates real server drafts via `POST /sessions/drafts`, removing the localStorage fallback and guaranteeing every outline change has a persisted id.
- New outline section endpoints (`PUT /sessions/builder/:id/outlines/sections/*`) keep add/update/delete/reorder/duplicate actions in sync with the backend draft record.
- Session builder context + UI call those endpoints so section edits, quick-add, and duplicate actions reflect immediately in autosave, publish, and Readiness scoring flows.
- Draft payloads normalize outline data (positions, defaults, timestamps) so older drafts continue to load safely.

---

## Phase 1: Core Infrastructure (Week 1-2)

### 1.1 Create RAG Integration Service

**File**: `packages/backend/src/services/rag-integration.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RagResult {
  text: string;
  metadata: {
    filename?: string;
    category?: string;
    created_at?: string;
  };
  similarity: number;
  finalScore: number;
}

@Injectable()
export class RagIntegrationService {
  private readonly logger = new Logger(RagIntegrationService.name);
  private readonly ragBaseUrl: string;
  private readonly timeout: number;

  constructor(private configService: ConfigService) {
    this.ragBaseUrl = configService.get('RAG_API_URL') || 'http://localhost:8000';
    this.timeout = 10000; // 10 second timeout
  }

  /**
   * Query RAG system with smart weighting and error handling
   */
  async queryRAG(sessionMetadata: {
    category: string;
    audienceName?: string;
    desiredOutcome: string;
    currentProblem?: string;
  }): Promise<RagResult[]> {
    const query = this.buildQueryPrompt(sessionMetadata);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      this.logger.log(`RAG query: ${query}`);

      // Call tribeRAG /search endpoint
      const response = await fetch(`${this.ragBaseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filters: {
            category: sessionMetadata.category
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`RAG API error: ${response.status}`);
      }

      const data = await response.json();
      const hits = data.hits || [];

      this.logger.log(`RAG returned ${hits.length} results`);

      // Transform to RagResult format
      const results = hits.map((hit: any) => ({
        text: hit.snippet || '',
        metadata: {
          filename: hit.doc_id,
          category: sessionMetadata.category,
          created_at: undefined // tribeRAG doesn't return this
        },
        similarity: hit.score || 0,
        finalScore: hit.score || 0
      }));

      // Apply smart weighting and filtering
      return this.scoreAndFilterResults(results, sessionMetadata);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        this.logger.warn(`RAG query timed out after ${this.timeout}ms, falling back to baseline`);
      } else {
        this.logger.error('RAG query failed', error);
      }

      return []; // Graceful fallback
    }
  }

  /**
   * Retry RAG query once if it fails
   */
  async queryRAGWithRetry(sessionMetadata: any): Promise<RagResult[]> {
    try {
      return await this.queryRAG(sessionMetadata);
    } catch (error) {
      this.logger.warn('RAG query failed, retrying once...', error);
      try {
        return await this.queryRAG(sessionMetadata);
      } catch (retryError) {
        this.logger.error('RAG retry failed, returning empty results', retryError);
        return [];
      }
    }
  }

  /**
   * Score and filter RAG results by multiple factors
   */
  private scoreAndFilterResults(sources: RagResult[], metadata: any): RagResult[] {
    return sources
      .map(source => ({
        ...source,
        finalScore: this.calculateWeightedScore(source, metadata)
      }))
      .filter(s => s.finalScore > 0.65) // Quality threshold
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 8); // Top 8 chunks
  }

  /**
   * Calculate weighted score: similarity + recency + category match
   */
  private calculateWeightedScore(source: RagResult, metadata: any): number {
    const similarity = source.similarity || 0;
    const recency = this.getRecencyScore(source.metadata?.created_at);
    const categoryMatch = source.metadata?.category === metadata.category ? 1.0 : 0.5;

    return (
      similarity * 0.5 +      // Similarity (50%)
      recency * 0.2 +         // Recency (20%)
      categoryMatch * 0.2 +   // Category match (20%)
      0.1                     // Base score (10%)
    );
  }

  /**
   * Calculate recency score (newer = higher)
   */
  private getRecencyScore(createdAt?: string): number {
    if (!createdAt) return 0.5; // Default for unknown age

    const age = Date.now() - new Date(createdAt).getTime();
    const daysOld = age / (1000 * 60 * 60 * 24);

    // Decay over 365 days
    return Math.max(0, 1 - (daysOld / 365));
  }

  /**
   * Build natural language query for RAG
   */
  private buildQueryPrompt(metadata: any): string {
    return `Training session about ${metadata.category}${
      metadata.audienceName ? ` for ${metadata.audienceName}` : ''
    } focused on: ${metadata.desiredOutcome}${
      metadata.currentProblem ? `. Addressing: ${metadata.currentProblem}` : ''
    }`;
  }

  /**
   * Inject RAG context into OpenAI prompt with weight control
   */
  injectContextIntoPrompt(basePrompt: string, ragResults: RagResult[], weight: number): string {
    if (!ragResults?.length || weight === 0) {
      return basePrompt;
    }

    // Limit context based on weight (0.0-1.0)
    const contextLimit = Math.floor(3000 * weight); // Max 3000 tokens at weight=1.0
    const selectedResults = this.selectContextByTokenLimit(ragResults, contextLimit);

    if (selectedResults.length === 0) {
      return basePrompt;
    }

    // Build RAG context section
    const ragContext = selectedResults.map((r, idx) =>
      `## Source ${idx + 1}: ${r.metadata?.filename || 'Unknown'} (${r.metadata?.category || 'General'})
${r.text.substring(0, 500)}...
---`
    ).join('\n\n');

    return `# Retrieved Training Materials from Knowledge Base

${ragContext}

# Your Task

Using the above materials as reference and inspiration, ${basePrompt}`;
  }

  /**
   * Select RAG results within token limit
   */
  private selectContextByTokenLimit(results: RagResult[], limit: number): RagResult[] {
    // Rough estimation: ~4 chars per token
    let totalChars = 0;
    const selected = [];

    for (const result of results) {
      const estimatedTokens = result.text.length / 4;
      if (totalChars + estimatedTokens > limit * 4) break;

      selected.push(result);
      totalChars += result.text.length;
    }

    return selected;
  }
}
```

**Add to Module**: Update `sessions.module.ts`:
```typescript
import { RagIntegrationService } from '../../services/rag-integration.service';

@Module({
  // ...
  providers: [SessionsService, RagIntegrationService, ...],
})
```

---

### 1.2 Create Multi-Variant Generation Method

**File**: `packages/backend/src/modules/sessions/sessions.service.ts`

Add these interfaces:
```typescript
interface Variant {
  id: string;
  outline: any;
  generationSource: 'rag' | 'baseline';
  ragWeight: number;
  ragSourcesUsed: number;
  label: string;
  description: string;
}

interface MultiVariantResponse {
  variants: Variant[];
  metadata: {
    processingTime: number;
    ragAvailable: boolean;
    ragSourcesFound: number;
    totalVariants: number;
    averageSimilarity?: number;
  };
}
```

Add new method to `SessionsService`:
```typescript
constructor(
  // ... existing
  private readonly ragService: RagIntegrationService,
) {}

/**
 * Generate 4 variants with different RAG weights
 */
async suggestMultipleOutlines(payload: SuggestOutlineDto): Promise<MultiVariantResponse> {
  const startTime = Date.now();

  this.logger.log('Starting multi-variant generation', {
    category: payload.category,
    audience: payload.audienceName,
    sessionType: payload.sessionType,
    timestamp: new Date().toISOString()
  });

  // Step 1: Query RAG once with retry (reuse for all variants)
  let ragResults: any[] = [];
  let ragAvailable = false;

  try {
    ragResults = await this.ragService.queryRAGWithRetry({
      category: payload.category,
      audienceName: payload.audienceName,
      desiredOutcome: payload.desiredOutcome,
      currentProblem: payload.currentProblem
    });
    ragAvailable = ragResults.length > 0;

    const avgSimilarity = ragResults.length > 0
      ? ragResults.reduce((sum, r) => sum + r.similarity, 0) / ragResults.length
      : 0;

    this.logger.log('RAG query completed', {
      resultsFound: ragResults.length,
      ragAvailable,
      averageSimilarity: avgSimilarity.toFixed(3),
      queryTime: Date.now() - startTime
    });
  } catch (error) {
    this.logger.warn('RAG query failed completely, proceeding with baseline only', error);
  }

  // Step 2: Generate 4 variants in parallel with different RAG weights
  const ragWeights = [0.8, 0.5, 0.2, 0.0]; // Heavy, Balanced, Light, None

  const variantPromises = ragWeights.map((weight, index) =>
    this.generateSingleVariant(payload, ragResults, weight, index)
      .then(result => {
        this.logger.log(`Variant ${index + 1} generated`, {
          ragWeight: weight,
          sectionsCount: result.outline.sections.length,
          totalDuration: result.outline.totalDuration,
        });
        return result;
      })
      .catch(error => {
        this.logger.error(`Variant ${index + 1} generation failed`, error);
        return null;
      })
  );

  const variantResults = await Promise.all(variantPromises);

  // Filter out failed variants
  const variants = variantResults
    .filter(v => v !== null)
    .map((v, i) => ({
      id: `variant-${i + 1}`,
      outline: v.outline,
      generationSource: ragWeights[i] > 0 ? 'rag' as const : 'baseline' as const,
      ragWeight: ragWeights[i],
      ragSourcesUsed: ragWeights[i] > 0 ? ragResults.length : 0,
      label: this.getVariantLabel(i),
      description: this.getVariantDescription(i, payload.category)
    }));

  const avgSimilarity = ragResults.length > 0
    ? ragResults.reduce((sum, r) => sum + r.similarity, 0) / ragResults.length
    : undefined;

  this.logger.log('Multi-variant generation complete', {
    totalVariants: variants.length,
    totalTime: Date.now() - startTime,
    ragAvailable
  });

  return {
    variants,
    metadata: {
      processingTime: Date.now() - startTime,
      ragAvailable,
      ragSourcesFound: ragResults.length,
      totalVariants: variants.length,
      averageSimilarity: avgSimilarity
    }
  };
}

/**
 * Generate a single variant with specific RAG weight
 */
private async generateSingleVariant(
  payload: SuggestOutlineDto,
  ragResults: any[],
  ragWeight: number,
  variantIndex: number
): Promise<{ outline: any }> {
  const duration = payload.duration || 90; // Default 90 minutes

  // Load audience and tone profiles (same as existing suggestOutline)
  let audience = null;
  let tone = null;

  if (payload.audienceId) {
    audience = await this.audiencesRepository.findOne({
      where: { id: payload.audienceId }
    });
  }

  if (payload.toneId) {
    tone = await this.tonesRepository.findOne({
      where: { id: payload.toneId }
    });
  }

  // Build OpenAI request
  const openAIRequest: any = {
    title: payload.title,
    category: payload.category,
    sessionType: payload.sessionType,
    desiredOutcome: payload.desiredOutcome,
    currentProblem: payload.currentProblem,
    specificTopics: payload.specificTopics,
    duration,
    audienceSize: payload.audienceSize || '8-20',
  };

  // Add audience profile
  if (audience) {
    openAIRequest.audienceName = audience.name;
    openAIRequest.audienceDescription = audience.description;
    openAIRequest.audienceExperienceLevel = audience.experienceLevel;
    openAIRequest.audienceTechnicalDepth = audience.technicalDepth;
    openAIRequest.audienceCommunicationStyle = audience.communicationStyle;
    openAIRequest.audienceVocabularyLevel = audience.vocabularyLevel;
    openAIRequest.audienceLearningStyle = audience.preferredLearningStyle;
    openAIRequest.audienceExampleTypes = audience.exampleTypes;
    openAIRequest.audienceAvoidTopics = audience.avoidTopics;
    openAIRequest.audienceInstructions = audience.promptInstructions;
  }

  // Add tone profile
  if (tone) {
    openAIRequest.toneName = tone.name;
    openAIRequest.toneDescription = tone.description;
    openAIRequest.toneStyle = tone.style;
    openAIRequest.toneFormality = tone.formality;
    openAIRequest.toneEnergyLevel = tone.energyLevel;
    openAIRequest.toneSentenceStructure = tone.sentenceStructure;
    openAIRequest.toneLanguageCharacteristics = tone.languageCharacteristics;
    openAIRequest.toneEmotionalResonance = tone.emotionalResonance;
    openAIRequest.toneExamplePhrases = tone.examplePhrases;
    openAIRequest.toneInstructions = tone.promptInstructions;
  }

  // Generate with OpenAI (inject RAG context based on weight)
  const aiOutline = await this.openAIService.generateSessionOutline(
    openAIRequest,
    ragResults,
    ragWeight
  );

  // Convert to our format
  const sections = aiOutline.sections.map((section: any, index: number) => ({
    id: `ai-${Date.now()}-${variantIndex}-${index}`,
    type: this.mapSectionType(section.title, index),
    position: index,
    title: section.title,
    duration: section.duration,
    description: section.description,
    learningObjectives: section.learningObjectives || [],
    suggestedActivities: section.suggestedActivities || [],
  }));

  // Balance durations to match target
  const balancedSections = this.balanceDurations(sections, duration);

  // Find matching topics
  const matchingTopics = await this.findMatchingTopics(balancedSections);
  const enhancedSections = await this.associateTopicsWithSections(balancedSections, matchingTopics);

  const totalDuration = enhancedSections.reduce((acc, s) => acc + s.duration, 0);

  return {
    outline: {
      sections: enhancedSections,
      totalDuration,
      suggestedSessionTitle: aiOutline.suggestedTitle,
      suggestedDescription: aiOutline.summary,
      difficulty: aiOutline.difficulty || 'Intermediate',
      recommendedAudienceSize: aiOutline.recommendedAudienceSize || '8-20',
      fallbackUsed: false,
      generatedAt: new Date().toISOString(),
    }
  };
}

/**
 * Balance section durations to match target (within 10% tolerance)
 */
private balanceDurations(sections: any[], targetDuration: number): any[] {
  const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

  // If within 10% tolerance, keep as-is
  if (Math.abs(totalDuration - targetDuration) <= targetDuration * 0.1) {
    return sections;
  }

  // Proportionally adjust all sections
  const ratio = targetDuration / totalDuration;

  return sections.map(section => ({
    ...section,
    duration: Math.round(section.duration * ratio)
  }));
}

/**
 * Get variant label
 */
private getVariantLabel(index: number): string {
  const labels = [
    'Knowledge Base-Driven',
    'Recommended Mix',
    'Creative Approach',
    'Alternative Structure'
  ];
  return labels[index];
}

/**
 * Get variant description
 */
private getVariantDescription(index: number, category: string): string {
  const descriptions = [
    `Based on your training materials for ${category}`,
    'Blend of your content + proven frameworks',
    'Fresh perspective using industry best practices',
    'Different flow, same outcome focus'
  ];
  return descriptions[index];
}

/**
 * Log variant selection for analytics
 */
async logVariantSelection(
  sessionId: string,
  variantDetails: {
    variantId: string;
    generationSource: 'rag' | 'baseline';
    ragWeight: number;
    ragSourcesUsed: number;
    category: string;
  }
): Promise<void> {
  try {
    // Log to AI interactions for tracking
    await this.aiInteractionsService.create({
      interactionType: AIInteractionType.VARIANT_SELECTION,
      status: AIInteractionStatus.SUCCESS,
      inputVariables: variantDetails,
      metadata: {
        sessionId,
        timestamp: new Date().toISOString()
      }
    });

    this.logger.log(`Variant selected: ${JSON.stringify(variantDetails)}`);
  } catch (error) {
    this.logger.error('Failed to log variant selection', error);
  }
}
```

---

### 1.3 Update OpenAI Service with Prompt Refinement

**File**: `packages/backend/src/services/openai.service.ts`

Modify `generateSessionOutline` to accept RAG context and use dynamic system prompts:

```typescript
async generateSessionOutline(
  request: OpenAISessionOutlineRequest,
  ragResults?: any[],
  ragWeight?: number
): Promise<OpenAISessionOutline> {
  if (!this.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Build base prompt
  let prompt = this.buildPrompt(request);

  // Inject RAG context if provided
  if (ragResults && ragWeight > 0) {
    prompt = this.injectRAGContext(prompt, ragResults, ragWeight);
  }

  // Build dynamic system prompt based on RAG weight
  const systemPrompt = this.buildSystemPrompt(ragWeight || 0);

  const startTime = Date.now();

  // ... rest of existing implementation, but use systemPrompt:
  const response = await fetch(`${this.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt // ← Use dynamic system prompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    }),
  });

  // ... rest of existing implementation
}

/**
 * Build dynamic system prompt based on RAG weight
 */
private buildSystemPrompt(ragWeight: number): string {
  const basePrompt = `You are an expert training content designer specializing in creating engaging, outcome-focused training sessions for financial professionals.

You excel at creating practical, immediately applicable session structures that drive measurable results.

Respond ONLY with valid JSON matching this exact structure:
{
  "suggestedTitle": "string",
  "summary": "string (2-3 sentences)",
  "sections": [
    {
      "title": "string",
      "duration": number,
      "description": "string (2-3 sentences)",
      "learningObjectives": ["string", "string"],
      "suggestedActivities": ["string", "string"]
    }
  ],
  "totalDuration": number,
  "difficulty": "Beginner|Intermediate|Advanced",
  "recommendedAudienceSize": "string"
}

IMPORTANT: Create exactly 4 sections for a 90-minute session:
- Section 1: Opening/Welcome (10-15 min)
- Sections 2-3: Core Content Topics (25-35 min each)
- Section 4: Closing/Commitments (10-15 min)

Make sessions practical, engaging, and outcome-focused. Include interactive elements.`;

  if (ragWeight >= 0.5) {
    // Heavy RAG: emphasize fidelity to source materials
    return `${basePrompt}

Your task is to create a session outline that draws heavily from the provided training materials. Stay faithful to the frameworks, examples, and terminology found in the knowledge base. Adapt the structure to fit the desired outcome while preserving the proven approaches documented in the sources.`;
  } else if (ragWeight > 0) {
    // Light RAG: use as inspiration
    return `${basePrompt}

Use the provided training materials as inspiration and reference points, but feel free to combine them creatively with your expertise to create a fresh, engaging session structure.`;
  } else {
    // No RAG: pure creativity
    return `${basePrompt}

Create an innovative session outline using your expertise and industry best practices. Focus on practical, immediately applicable content that drives the desired outcome.`;
  }
}

/**
 * Inject RAG context into prompt
 */
private injectRAGContext(basePrompt: string, ragResults: any[], weight: number): string {
  if (!ragResults?.length) return basePrompt;

  const contextLimit = Math.floor(3000 * weight);
  let totalChars = 0;
  const selectedResults = [];

  for (const result of ragResults) {
    if (totalChars + result.text.length > contextLimit * 4) break;
    selectedResults.push(result);
    totalChars += result.text.length;
  }

  if (selectedResults.length === 0) return basePrompt;

  const ragContext = selectedResults.map((r, idx) =>
    `## Source ${idx + 1}: ${r.metadata?.filename || 'Unknown'}
${r.text.substring(0, 500)}...
---`
  ).join('\n\n');

  return `# Retrieved Training Materials from Knowledge Base

${ragContext}

# Your Task

Using the above materials as reference and inspiration, ${basePrompt}`;
}

private buildPrompt(request: OpenAISessionOutlineRequest): string {
  const parts = [
    `Create a ${request.sessionType} session outline for "${request.category}"`,
  ];

  if (request.title) {
    parts.push(`Working title: "${request.title}"`);
  }

  parts.push(`Desired outcome: ${request.desiredOutcome}`);

  if (request.currentProblem) {
    parts.push(`Current problem to solve: ${request.currentProblem}`);
  }

  if (request.specificTopics) {
    parts.push(`Must cover these topics: ${request.specificTopics}`);
  }

  parts.push(`Session duration: ${request.duration} minutes`);

  // ... rest of existing buildPrompt logic (audience/tone profiles)

  return parts.join('\n\n');
}
```

---

### 1.4 Add Controller Endpoint

**File**: `packages/backend/src/modules/sessions/sessions.controller.ts`

```typescript
@Post('builder/suggest-outline-v2')
async suggestMultipleOutlines(@Body() payload: SuggestOutlineDto) {
  return this.sessionsService.suggestMultipleOutlines(payload);
}

@Post('builder/:sessionId/log-variant-selection')
async logVariantSelection(
  @Param('sessionId') sessionId: string,
  @Body() variantDetails: any
) {
  return this.sessionsService.logVariantSelection(sessionId, variantDetails);
}
```

---

### 1.5 Add RAG Query Template to Admin

**File**: `packages/backend/src/entities/prompt.entity.ts`

```typescript
export enum PromptCategory {
  SESSION_GENERATION = 'session_generation',
  TITLE_CREATION = 'title_creation',
  CONTENT_ENHANCEMENT = 'content_enhancement',
  MARKETING_KIT = 'marketing_kit',
  TRAINING_KIT = 'training_kit',
  VALIDATION = 'validation',
  RAG_QUERY = 'rag_query', // ← ADD THIS
}
```

**Create seed/migration** to add default RAG query prompt:
```typescript
// Migration or seed file
const ragQueryPrompt = {
  name: 'default_rag_query',
  category: PromptCategory.RAG_QUERY,
  template: `Training session about {{category}} for {{audienceName}} ({{audienceExperienceLevel}} level).

Desired outcome: {{desiredOutcome}}
{{#if currentProblem}}Current challenge: {{currentProblem}}{{/if}}

Search for: training materials, best practices, case studies, examples, activities, and frameworks that would help achieve this outcome.`,
  description: 'Default template for RAG knowledge base queries',
  variables: ['category', 'audienceName', 'audienceExperienceLevel', 'desiredOutcome', 'currentProblem'],
  isActive: true,
  version: 1
};
```

Admin can now edit this via existing prompts UI to improve RAG relevance over time.

---

## Phase 2: Frontend Integration (Week 2-3)

### 2.1 Create Variant Selector Component with Fun Loading

**Visual Example of Variant Card**:

```
┌─────────────────────────────────────────────────┐
│ Knowledge Base-Driven                [RAG]      │
│ Based on your training materials for Prospecting│
├─────────────────────────────────────────────────┤
│ Prospecting Masterclass: From Cold to Committed │
│ 4 sections • 90 min                             │
│                                                  │
│ • Welcome & Mindset (15 min)                    │
│   Set the tone for the session, establish a     │
│   winning mindset, and reinforce why prospecting│
│   is the lifeblood of growth.                   │
│                                                  │
│ • Core Prospecting Strategies (30 min)         │
│   Learn specific, proven techniques for         │
│   identifying warm markets, starting            │
│   conversations naturally, and booking quality  │
│   appointments.                                  │
│                                                  │
│ • Practice & Role Play (30 min)                │
│   Engage in guided role plays and peer exercises│
│   that turn theory into real-world skill —      │
│   participants get instant feedback and         │
│   confidence.                                    │
│                                                  │
│ • Action Items & Follow-Up (15 min)            │
│   Wrap up with clear takeaways, set immediate   │
│   action goals, and outline how to track        │
│   progress over the next week.                  │
│                                                  │
│ [Select & Edit]  [💾 Save for Later]           │
└─────────────────────────────────────────────────┘
```

**File**: `packages/frontend/src/components/session-builder/VariantSelector.tsx`

```typescript
import * as React from 'react';
import { Button } from '../../ui';

interface Variant {
  id: string;
  outline: {
    suggestedSessionTitle: string;
    sections: any[];
    totalDuration: number;
  };
  generationSource: 'rag' | 'baseline';
  ragWeight: number;
  label: string;
  description: string;
}

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variantId: string) => void;
  onSaveForLater?: (variantId: string) => void;
  isLoading?: boolean;
  loadingProgress?: number;
  loadingStage?: string;
}

const loadingStages = [
  { progress: 0, message: "🔎 Looking for your best ideas…", icon: "🔎" },
  { progress: 20, message: "📚 Pulling in the most useful training material…", icon: "📖" },
  { progress: 40, message: "🧠 Thinking up smart ways to make it shine…", icon: "💭" },
  { progress: 60, message: "✨ Building Version 1 — powered by your knowledge base!", icon: "✍️" },
  { progress: 70, message: "🎨 Building Version 2 — the perfect mix of old and new!", icon: "🎯" },
  { progress: 80, message: "🚀 Building Version 3 — bold and creative!", icon: "💡" },
  { progress: 90, message: "🎪 Building Version 4 — a totally fresh approach!", icon: "🎭" },
  { progress: 100, message: "🎉 Done! Your four session ideas are ready to explore!", icon: "✅" }
];

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  onSelect,
  onSaveForLater,
  isLoading = false,
  loadingProgress = 0,
  loadingStage = ''
}) => {
  const [currentStageIndex, setCurrentStageIndex] = React.useState(0);

  // Simulate progress updates
  React.useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setCurrentStageIndex(prev => {
        if (prev < loadingStages.length - 1) return prev + 1;
        return prev;
      });
    }, 3000); // Change stage every 3 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  if (isLoading) {
    const currentStage = loadingStages[currentStageIndex];

    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="text-6xl animate-bounce mb-4">{currentStage.icon}</div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentStage.message}
          </h3>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${currentStage.progress}%` }}
            />
          </div>

          <p className="text-sm text-gray-500">
            Generating 4 variants... {currentStage.progress}%
          </p>

          {/* Fun tip */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 <strong>Pro tip:</strong> The more specific your desired outcome, the better the AI can tailor your session!
            </p>
          </div>

          {/* Live progress log (optional) */}
          {loadingStage && (
            <div className="mt-4 text-left bg-gray-50 p-3 rounded text-xs font-mono text-gray-600">
              <div className="opacity-50">✓ RAG query sent...</div>
              <div className="opacity-75">✓ Found relevant sources...</div>
              <div className="text-blue-600">⏳ {loadingStage}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Session Outline</h2>
        <p className="text-sm text-gray-600">
          Select the variant that best fits your needs. You can edit it in the next step.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {variants.map((variant, index) => (
          <div
            key={variant.id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{variant.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{variant.description}</p>
              </div>
              <span
                className={`ml-3 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  variant.generationSource === 'rag'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {variant.generationSource === 'rag' ? 'RAG' : 'AI'}
              </span>
            </div>

            {/* Preview */}
            <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded max-h-96 overflow-y-auto">
              <p className="text-sm font-medium text-gray-900">
                {variant.outline.suggestedSessionTitle}
              </p>
              <p className="text-xs text-gray-500">
                {variant.outline.sections.length} sections • {variant.outline.totalDuration} min
              </p>

              {/* Detailed section list with descriptions */}
              <div className="space-y-3 mt-3">
                {variant.outline.sections.map((section: any) => (
                  <div key={section.id} className="border-l-2 border-blue-200 pl-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-gray-900">
                        • {section.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({section.duration} min)
                      </span>
                    </div>
                    {section.description && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {section.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => onSelect(variant.id)}
                className="flex-1"
                variant="default"
              >
                Select & Edit
              </Button>
              {onSaveForLater && (
                <Button
                  onClick={() => onSaveForLater(variant.id)}
                  variant="outline"
                  size="sm"
                  title="Save for later"
                >
                  💾
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### 2.2 Update Session Builder Service

**File**: `packages/frontend/src/services/session-builder.service.ts`

Add interface:
```typescript
export interface MultiVariantResponse {
  variants: Array<{
    id: string;
    outline: SessionOutline;
    generationSource: 'rag' | 'baseline';
    ragWeight: number;
    ragSourcesUsed: number;
    label: string;
    description: string;
  }>;
  metadata: {
    processingTime: number;
    ragAvailable: boolean;
    ragSourcesFound: number;
    totalVariants: number;
    averageSimilarity?: number;
  };
}
```

Add methods:
```typescript
async generateMultipleOutlines(input: SessionBuilderInput): Promise<MultiVariantResponse> {
  try {
    const { date, ...payload } = input;
    const response = await api.post('/sessions/builder/suggest-outline-v2', payload);
    return response.data as MultiVariantResponse;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to generate session variants');
  }
}

async logVariantSelection(
  sessionId: string,
  variantDetails: {
    variantId: string;
    generationSource: 'rag' | 'baseline';
    ragWeight: number;
    ragSourcesUsed: number;
    category: string;
  }
): Promise<void> {
  try {
    await api.post(`/sessions/builder/${sessionId}/log-variant-selection`, variantDetails);
  } catch (error: any) {
    console.error('Failed to log variant selection', error);
  }
}
```

---

### 2.3 Integrate into Session Builder Context

**File**: `packages/frontend/src/features/session-builder/state/SessionBuilderContext.tsx`

Add state:
```typescript
const [variants, setVariants] = useState<any[]>([]);
const [variantsStatus, setVariantsStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
const [variantSelectionTime, setVariantSelectionTime] = useState<number>(0);
```

Add actions:
```typescript
const generateMultipleVariants = async () => {
  setVariantsStatus('pending');
  const startTime = Date.now();

  try {
    // Log start
    if (process.env.NODE_ENV === 'development') {
      console.log('[Session Builder v2] Generating variants...', {
        category: state.draft.metadata.category,
        desiredOutcome: state.draft.metadata.desiredOutcome
      });
    }

    const response = await sessionBuilderService.generateMultipleOutlines(state.draft.metadata);
    setVariants(response.variants);
    setVariantsStatus('success');

    // Log success
    if (process.env.NODE_ENV === 'development') {
      console.table(response.variants.map(v => ({
        Label: v.label,
        Source: v.generationSource,
        'RAG Weight': `${v.ragWeight * 100}%`,
        'RAG Sources': v.ragSourcesUsed,
        Sections: v.outline.sections.length,
        Duration: `${v.outline.totalDuration}m`
      })));
      console.log('Generation metadata:', response.metadata);
    }
  } catch (error) {
    console.error('Failed to generate variants', error);
    setVariantsStatus('error');
  }
};

const selectVariant = async (variantId: string) => {
  const selected = variants.find(v => v.id === variantId);
  if (!selected) return;

  // Log selection time
  const selectionTime = Date.now();
  setVariantSelectionTime(selectionTime);

  // Update outline
  updateOutline(selected.outline);

  // Track selection for analytics
  const variantDetails = {
    variantId: selected.id,
    generationSource: selected.generationSource,
    ragWeight: selected.ragWeight,
    ragSourcesUsed: selected.ragSourcesUsed,
    category: state.draft.metadata.category || '',
  };

  // Send to backend
  await sessionBuilderService.logVariantSelection(state.draft.id || 'new', variantDetails);

  // Also log to browser analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'variant_selected', {
      event_category: 'Session Builder v2',
      event_label: selected.generationSource,
      value: Math.round(selected.ragWeight * 100)
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Session Builder v2] Variant selected:', variantDetails);
  }
};
```

Expose in context:
```typescript
return (
  <SessionBuilderContext.Provider value={{
    // ... existing
    variants,
    variantsStatus,
    generateMultipleVariants,
    selectVariant,
  }}>
    {children}
  </SessionBuilderContext.Provider>
);
```

---

### 2.4 Update Session Builder Page

**File**: `packages/frontend/src/pages/SessionBuilderPage.tsx`

Import and use:
```typescript
import { VariantSelector } from '../components/session-builder/VariantSelector';

// In SessionBuilderScreen component:
const { variants, variantsStatus, generateMultipleVariants, selectVariant } = useSessionBuilder();

// Update generate step content:
case 'generate':
  return (
    <div className="space-y-6">
      {variants.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-4">Generate Session Variants</h3>
          <p className="text-sm text-gray-600 mb-6">
            We'll create 4 different session outlines for you to choose from,
            blending your knowledge base with AI creativity.
          </p>
          <Button
            onClick={generateMultipleVariants}
            disabled={variantsStatus === 'pending'}
            size="lg"
          >
            {variantsStatus === 'pending' ? 'Generating...' : 'Generate 4 Variants'}
          </Button>
        </div>
      ) : (
        <VariantSelector
          variants={variants}
          onSelect={(variantId) => {
            selectVariant(variantId);
            goToStep('review');
          }}
          onSaveForLater={(variantId) => {
            // TODO: Implement save for later in v2.1
            console.log('Save variant:', variantId);
          }}
          isLoading={variantsStatus === 'pending'}
        />
      )}

      {variantsStatus === 'error' && (
        <div className="text-center py-6">
          <p className="text-red-600 mb-4">Failed to generate variants. Please try again.</p>
          <Button onClick={generateMultipleVariants} variant="outline">
            Retry Generation
          </Button>
        </div>
      )}
    </div>
  );
```

---

### 2.5 Add Topic Library Browser (Optional Enhancement)

**File**: `packages/frontend/src/components/session-builder/TopicBrowserModal.tsx`

```typescript
import * as React from 'react';
import { Button } from '../../ui';

interface Topic {
  id: number;
  name: string;
  description?: string;
  category?: { name: string };
  learningOutcomes?: string;
  materialsNeeded?: string;
  trainerNotes?: string;
}

interface TopicBrowserModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTopic: (topic: Topic) => void;
}

export const TopicBrowserModal: React.FC<TopicBrowserModalProps> = ({
  open,
  onClose,
  onSelectTopic
}) => {
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      loadTopics();
    }
  }, [open, search]);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '20');

      const response = await fetch(`/api/admin/topics?${params.toString()}`);
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Failed to load topics', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Browse Topic Library</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Topic List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading topics...</div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No topics found</div>
          ) : (
            <div className="space-y-3">
              {topics.map(topic => (
                <div
                  key={topic.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                  onClick={() => {
                    onSelectTopic(topic);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                      {topic.description && (
                        <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                      )}
                      {topic.category && (
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {topic.category.name}
                        </span>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

**Add to SessionOutlineEditor or ArtifactsPreview**:
```typescript
const [showTopicBrowser, setShowTopicBrowser] = useState(false);

// In render:
<Button onClick={() => setShowTopicBrowser(true)}>
  📚 Browse Topic Library
</Button>

<TopicBrowserModal
  open={showTopicBrowser}
  onClose={() => setShowTopicBrowser(false)}
  onSelectTopic={(topic) => {
    // Convert topic to section
    const newSection = convertTopicToSection(topic, outline.sections.length + 1);
    updateOutline({
      ...outline,
      sections: [...outline.sections, newSection]
    });
  }}
/>

function convertTopicToSection(topic: Topic, position: number): FlexibleSessionSection {
  return {
    id: `topic-${topic.id}-${Date.now()}`,
    type: 'topic',
    position,
    title: topic.name,
    duration: 30, // Default, user can adjust
    description: topic.description || '',
    learningObjectives: topic.learningOutcomes?.split('\n').filter(Boolean) || [],
    materialsNeeded: topic.materialsNeeded?.split('\n').filter(Boolean) || [],
    trainerNotes: topic.trainerNotes,
    associatedTopic: {
      id: topic.id,
      name: topic.name,
      description: topic.description,
    }
  };
}
```

---

## Phase 3: Testing & Validation (Week 3-4)

### 3.1 Manual Testing Checklist

#### Backend Testing
- [ ] RAG service connects to tribeRAG successfully (`http://localhost:8000/search`)
- [ ] RAG query returns results for test categories (Prospecting, Closing, etc.)
- [ ] Smart weighting produces higher scores for recent + category-matched content
- [ ] Error handling works (simulate RAG timeout, RAG service down)
- [ ] All 4 variants generate without errors
- [ ] Duration balancing works correctly (test 30min, 90min, 180min, 240min)
- [ ] Variants have different RAG weights (0.8, 0.5, 0.2, 0.0)
- [ ] System prompts adapt based on RAG weight
- [ ] Variant selection is logged correctly

#### Frontend Testing
- [ ] Variant selector displays all 4 cards correctly
- [ ] RAG badge shows on variants 1-2 only (generationSource === 'rag')
- [ ] Labels and descriptions display properly
- [ ] Fun loading screen shows with animated progress
- [ ] Loading stages advance every 3 seconds
- [ ] "Select & Edit" navigates to review step with correct outline
- [ ] Loading state shows during generation
- [ ] Error state handles failures gracefully with retry button
- [ ] Topic browser modal opens and loads topics
- [ ] Selected topics convert to sections correctly

#### Integration Testing
- [ ] End-to-end flow: input → generate → select → edit → publish
- [ ] Multiple sessions created successfully
- [ ] Different categories produce different RAG results
- [ ] Variant selection is tracked in analytics
- [ ] Console logs show structured data in development mode
- [ ] Auto-save topics on publish works (verify in /admin/topics)

#### Analytics Testing
- [ ] Variant selections are logged to backend
- [ ] Google Analytics events fire (if configured)
- [ ] Can retrieve selection metrics from backend
- [ ] Logs show RAG query details (results count, similarity scores)

---

### 3.2 Quality Validation

Generate **10 test sessions** across different categories:
1. Prospecting
2. Closing
3. Leadership Development
4. Product Training
5. Objection Handling
6. Financial Planning
7. Recruiting
8. Licensing
9. Life Insurance
10. Investments

**For each session, compare**:
- Do RAG variants (1-2) feel more relevant to category?
- Are section suggestions more specific/actionable?
- Do durations balance correctly to 90 minutes?
- Are learning objectives aligned with desired outcomes?
- Do system prompts create noticeable differences in tone/approach?

**Document findings**:
- Which variant was selected most often?
- What RAG weight seems optimal?
- Are there categories where RAG doesn't help?
- Are there quality issues with any variant?

---

### 3.3 Edge Cases to Test

- [ ] RAG service is down → should generate 4 baseline variants gracefully
- [ ] RAG timeout (>10s) → should fall back to baseline
- [ ] No RAG results found (category not in knowledge base) → should warn user, proceed with AI-only
- [ ] Very short session (30min) → sections should still balance
- [ ] Very long session (4hr) → should have realistic section breakdown
- [ ] Missing optional fields (currentProblem, specificTopics) → should still work
- [ ] OpenAI rate limit hit → should retry and show helpful error
- [ ] All 4 variants fail → should show error with retry button
- [ ] Network failure mid-generation → should handle gracefully

---

## Success Metrics

### Track After 20 Sessions Created

#### Quantitative Metrics

1. **Selection Rate** (Primary Success Metric)
   - **Hypothesis**: Variant 1 (RAG 80%) or Variant 2 (RAG 50%) chosen >50% of time
   - **How to measure**: Query `ai_interactions` table for `VARIANT_SELECTION` type
   - **Target**: RAG selection rate > 50%

2. **Edit Depth**
   - **Hypothesis**: RAG variants require fewer edits than baseline
   - **How to measure**: Track section changes between selection and publish
   - **Target**: RAG sessions have 20% fewer edits

3. **Time to Publish**
   - **Hypothesis**: RAG users publish faster (less editing needed)
   - **How to measure**: Time from variant selection to publish button
   - **Target**: RAG sessions published 25% faster

4. **Readiness Score**
   - **Hypothesis**: RAG variants have higher initial readiness
   - **How to measure**: Compare readiness scores at selection vs. publish
   - **Target**: RAG sessions start with 10+ point higher readiness

5. **RAG Quality Indicators**
   - Average similarity score from RAG queries
   - Average number of RAG sources per query
   - RAG timeout/failure rate

#### Qualitative Metrics

1. **User Feedback Survey** (after 5 sessions)
   - "Which variant was most helpful and why?"
   - "Did the AI-generated content feel relevant to your needs?"
   - "How much editing was required?"

2. **Trainer Feedback** (post-training)
   - "Was the session usable as-is?"
   - "Did the outline help you prepare effectively?"

3. **Content Quality Review** (manual)
   - Side-by-side comparison of RAG vs baseline quality
   - Check for hallucinations, irrelevant content, or errors

---

## Rollout Strategy

### Week 1-2: Development
- Build all components per plan above
- Unit test individual components
- Integration test end-to-end flow

### Week 3: Internal Testing
- Deploy to staging environment
- Enable feature flag: `ENABLE_VARIANT_GENERATION_V2=true` for admins only
- Create 10-15 test sessions across all categories
- Gather internal feedback via survey
- Refine RAG query template if needed
- Fix critical bugs

### Week 4: Limited Beta
- Enable for 10% of users (feature flag or user role)
- Monitor metrics dashboard closely:
  - Selection rates
  - Error rates
  - Generation times
  - RAG query success rate
- Fix any critical bugs
- Gather user feedback

### Week 5+: Full Rollout Decision

**If metrics positive** (>50% RAG selection rate):
- Enable for 50% of users (A/B test)
- Continue monitoring for 1 week
- If still positive, enable for all users
- Consider deprecating v1 endpoint eventually

**If metrics neutral/negative** (<50% RAG selection rate):
- Iterate on RAG query template
- Adjust RAG weighting algorithm
- Try different RAG weight distributions
- Or pivot to different enhancements

---

## Effort Estimate

| Phase | Backend | Frontend | Testing | Total |
|-------|---------|----------|---------|-------|
| Phase 1: Infrastructure | 12-14h | - | 2h | 14-16h |
| Phase 2: UI Integration | 3h | 8-10h | 2h | 13-15h |
| Phase 3: Testing & Polish | 1h | 2h | 6-8h | 9-11h |
| UX Enhancements | 1h | 4-5h | 1h | 6-7h |
| **Total** | **17-19h** | **14-17h** | **11-13h** | **42-49h** |

**Realistic Timeline**: 4-5 weeks at 10 hours/week

---

## What's Next (v2.1 and Beyond)

Once RAG effectiveness is proven (>50% selection rate), add:

### v2.1 Features (2-3 weeks)
1. **Saved Ideas Entity** - Let users save variants for later reuse
2. **Confirmation Page** - Post-publish workflow with Marketing/Trainer Kit CTAs
3. **Collections** - Organize saved ideas into themed groups
4. **Configurable RAG Weights** - Move weights to environment variables for easy tuning

### v2.2+ Features (Future)
1. **Learn from Edits** - Track user edits to improve AI over time
2. **One-Click Hybrid** - Mix sections from multiple variants
3. **Advanced RAG Weighting** - Let users adjust RAG amount via slider
4. **Category-Specific Prompts** - Specialized templates per category
5. **Context Deduplication** - Remove near-identical RAG chunks
6. **Sentence Boundary Truncation** - Preserve semantic flow in RAG context

---

## Open Questions

1. **RAG Environment**: Where is tribeRAG deployed? (localhost:8000 or remote URL?)
2. **RAG Categories**: Do tribeRAG categories match your session categories exactly?
3. **Analytics Tool**: What tool are you using to track variant selections? (Google Analytics, Mixpanel, custom?)
4. **Feature Flag System**: Do you have a feature flag system or should we use env var?
5. **Error Handling UX**: Preferred UX when all 4 variants fail to generate? (Show error + retry? Fall back to v1?)
6. **Auto-Save Topics**: Has the existing auto-save topics feature been tested? Need verification.

---

## Implementation Checklist

### Prerequisites
- [ ] Set up `RAG_API_URL` environment variable
- [ ] Verify tribeRAG is accessible at `http://localhost:8000/search`
- [ ] Test RAG query with sample data
- [ ] Add `RAG_QUERY` to `PromptCategory` enum
- [ ] Seed default RAG query prompt template

### Phase 1: Backend (Week 1-2)
- [ ] Create `RagIntegrationService`
- [ ] Add error handling & timeouts to RAG queries
- [ ] Implement smart weighting algorithm
- [ ] Create `suggestMultipleOutlines` method
- [ ] Add duration balancing utility
- [ ] Update `OpenAIService` with dynamic system prompts
- [ ] Add `/builder/suggest-outline-v2` endpoint
- [ ] Add `/builder/:id/log-variant-selection` endpoint
- [ ] Add structured logging throughout
- [ ] Test all backend components

### Phase 2: Frontend (Week 2-3)
- [ ] Create `VariantSelector` component with fun loading
- [ ] Add loading stages and progress animations
- [ ] Update `session-builder.service.ts` with new methods
- [ ] Add variant selection to `SessionBuilderContext`
- [ ] Update `SessionBuilderPage` generate step
- [ ] Add analytics tracking (gtag events)
- [ ] Add console logging for development
- [ ] Create `TopicBrowserModal` (optional)
- [ ] Wire up topic library integration
- [ ] Test all frontend components

### Phase 3: Testing (Week 3-4)
- [ ] Complete backend testing checklist
- [ ] Complete frontend testing checklist
- [ ] Complete integration testing checklist
- [ ] Generate 10 test sessions for quality validation
- [ ] Test all edge cases
- [ ] Verify auto-save topics functionality
- [ ] Set up analytics dashboard
- [ ] Document known issues/limitations

### Phase 4: Rollout (Week 4-5)
- [ ] Deploy to staging
- [ ] Internal testing (5-10 sessions)
- [ ] Gather internal feedback
- [ ] Fix critical bugs
- [ ] Enable for 10% of users
- [ ] Monitor metrics for 1 week
- [ ] Make go/no-go decision

---

## Technical Notes

### RAG API Integration Details

**Base URL**: Configurable via `RAG_API_URL` (default: `http://localhost:8000`)

**Search Endpoint**: `POST /search`
- Uses hybrid search (BM25 + vector similarity)
- Returns scored results (0.0-1.0)
- Supports category filters
- Includes recency boost

**Expected Response Format**:
```json
{
  "hits": [
    {
      "doc_id": "string",
      "chunk_id": "string",
      "score": 0.875,
      "snippet": "string (text content)",
      "path": "string (storage path)"
    }
  ]
}
```

**Error Handling**:
- Timeout after 10 seconds
- Retry once on failure
- Graceful fallback to baseline generation
- Structured error logging

### Analytics Schema

**Variant Selection Event**:
```typescript
{
  interactionType: 'VARIANT_SELECTION',
  status: 'SUCCESS',
  inputVariables: {
    variantId: string,
    generationSource: 'rag' | 'baseline',
    ragWeight: number,
    ragSourcesUsed: number,
    category: string,
  },
  metadata: {
    sessionId: string,
    timestamp: string,
  }
}
```

### Performance Targets

- **RAG Query**: < 2 seconds
- **Single Variant Generation**: < 8 seconds
- **Total Generation Time**: < 25 seconds (all 4 variants in parallel)
- **RAG Success Rate**: > 90%
- **Variant Selection Rate**: > 50% for RAG variants

---

## Support & Resources

**Documentation**:
- tribeRAG API: `/docs-reference/tribeRAG-API_DOCUMENTATION.md`
- OpenAPI docs: `http://localhost:8000/docs` (tribeRAG)
- Session Builder existing code: `/packages/frontend/src/pages/SessionBuilderPage.tsx`

**Key Files**:
- Backend RAG service: `/packages/backend/src/services/rag-integration.service.ts`
- Backend sessions service: `/packages/backend/src/modules/sessions/sessions.service.ts`
- Frontend variant selector: `/packages/frontend/src/components/session-builder/VariantSelector.tsx`
- Frontend context: `/packages/frontend/src/features/session-builder/state/SessionBuilderContext.tsx`

---

## Ready to Implement?

This MVP focuses on **proving RAG adds value** while ensuring production readiness through proper error handling, analytics, and observability.

**Next Steps**:
1. ✅ Review this plan and answer open questions
2. ✅ Set up RAG_API_URL environment variable
3. ✅ Test RAG connectivity: `curl -X POST http://localhost:8000/search -H "Content-Type: application/json" -d '{"query":"prospecting training"}'`
4. ✅ Start with Phase 1 (backend infrastructure)
5. ✅ Test RAG quality with 5-10 manual queries
6. ✅ If RAG results look good → proceed to Phase 2
7. ✅ If RAG results are poor → refine query template first

**Key Decision Point**: After Phase 1, evaluate RAG result quality before investing in full UI. Generate 5 sample queries across different categories and manually review relevance.

**Success = 50%+ RAG selection rate after 20 sessions**
