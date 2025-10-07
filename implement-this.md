# Session Builder v2.0 - MVP Implementation Plan

## Executive Summary

**Goal**: Implement Session Builder v2.0 with RAG-powered multi-variant generation to help brokers and content developers create quality sessions faster.

**MVP Approach**: Focus on 4 high-impact enhancements that prove RAG adds value before building additional infrastructure.

**Timeline**: 2-3 weeks (23-29 hours)
**Risk**: Low (separate endpoint, zero impact to existing flow)
**Key Success Metric**: Do users select RAG variants >50% of the time?

---

## Why This MVP?

### Problems We're Solving
1. **Brokers/content developers** struggle to create relevant session content
2. **Trainers** aren't well prepared (sessions lack depth)
3. **Teams** don't collaborate effectively on session ideas
4. **Participants** don't know what they're showing up for

### What We're NOT Building (Yet)
- ❌ Saved Ideas entity (defer to v2.1)
- ❌ Confirmation page (defer to v2.1)
- ❌ Advanced features (learning from edits, collections, etc.)

**Why**: Need to validate RAG effectiveness first before investing in infrastructure.

---

## The 4 Core Enhancements

### 1. Smart RAG Context Injection (Quality Foundation)
**Effort**: ⭐⭐ Medium (6-8 hours)
**Impact**: ⭐⭐⭐⭐⭐ Very High

Weight RAG results by:
- Similarity score (50%)
- Recency (20%)
- Category match (20%)
- Base score (10%)

Filter to top 8 chunks with score > 0.65, max 3000 tokens.

---

### 2. Hybrid Generation Strategy (A/B Testing)
**Effort**: ⭐ Very Low (3-4 hours)
**Impact**: ⭐⭐⭐⭐ High

Generate 4 variants with different RAG weights:
- Variant 1: Heavy RAG (80% RAG context)
- Variant 2: Balanced RAG (50% RAG context)
- Variant 3: Light RAG (20% RAG hints)
- Variant 4: Pure AI (0% RAG, baseline)

---

### 3. Smart Variant Labeling (UX Polish)
**Effort**: ⭐ Very Low (2-3 hours)
**Impact**: ⭐⭐⭐⭐⭐ Very High

Label variants clearly:
- "Knowledge Base-Driven" (RAG badge)
- "Recommended Mix" (RAG badge)
- "Creative Approach" (AI badge)
- "Alternative Structure" (AI badge)

Add 1-line descriptions so users know what they're choosing.

---

### 4. Real-Time Duration Balancing (Quality Boost)
**Effort**: ⭐ Low (2-3 hours)
**Impact**: ⭐⭐⭐ Medium-High

Auto-adjust section durations to match target session length (within 10% tolerance).

---

## Technical Architecture

### New Endpoint Strategy
- **Keep**: `POST /sessions/builder/suggest-outline` (existing)
- **New**: `POST /sessions/builder/suggest-outline-v2` (4 variants)
- Frontend routes to v2 when ready
- **Zero risk** to existing users

---

## Phase 1: Core Infrastructure (Week 1)

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

  constructor(private configService: ConfigService) {
    this.ragBaseUrl = configService.get('RAG_API_URL') || 'http://localhost:8000';
  }

  /**
   * Query RAG system with smart weighting
   */
  async queryRAG(sessionMetadata: {
    category: string;
    audienceName?: string;
    desiredOutcome: string;
    currentProblem?: string;
  }): Promise<RagResult[]> {
    const query = this.buildQueryPrompt(sessionMetadata);

    try {
      // Call tribeRAG2 API
      const response = await fetch(`${this.ragBaseUrl}/query/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ query })
      });

      if (!response.ok) {
        throw new Error(`RAG API error: ${response.status}`);
      }

      const data = await response.json();

      // Apply smart weighting and filtering
      return this.scoreAndFilterResults(data.sources || [], sessionMetadata);
    } catch (error) {
      this.logger.error('RAG query failed', error);
      return [];
    }
  }

  /**
   * Score and filter RAG results by multiple factors
   */
  private scoreAndFilterResults(sources: any[], metadata: any): RagResult[] {
    return sources
      .map(source => ({
        text: source.text,
        metadata: source.metadata || {},
        similarity: source.score || 0,
        finalScore: this.calculateWeightedScore(source, metadata)
      }))
      .filter(s => s.finalScore > 0.65) // Quality threshold
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 8); // Top 8 chunks
  }

  /**
   * Calculate weighted score: similarity + recency + category match
   */
  private calculateWeightedScore(source: any, metadata: any): number {
    const similarity = source.score || 0;
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

**Environment Variable**: Add to `.env`:
```
RAG_API_URL=http://localhost:8000
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

  // Step 1: Query RAG once (reuse for all variants)
  let ragResults: any[] = [];
  let ragAvailable = false;

  try {
    ragResults = await this.ragService.queryRAG({
      category: payload.category,
      audienceName: payload.audienceName,
      desiredOutcome: payload.desiredOutcome,
      currentProblem: payload.currentProblem
    });
    ragAvailable = ragResults.length > 0;
    this.logger.log(`RAG query returned ${ragResults.length} results`);
  } catch (error) {
    this.logger.warn('RAG query failed, proceeding with baseline only', error);
  }

  // Step 2: Generate 4 variants in parallel with different RAG weights
  const ragWeights = [0.8, 0.5, 0.2, 0.0]; // Heavy, Balanced, Light, None

  const variantPromises = ragWeights.map((weight, index) =>
    this.generateSingleVariant(payload, ragResults, weight, index)
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

  return {
    variants,
    metadata: {
      processingTime: Date.now() - startTime,
      ragAvailable,
      ragSourcesFound: ragResults.length,
      totalVariants: variants.length
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
  const duration = payload.duration || 90;

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
 * Balance section durations to match target
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
```

---

### 1.3 Update OpenAI Service

**File**: `packages/backend/src/services/openai.service.ts`

Modify `generateSessionOutline` to accept RAG context:

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
    // You'll need to inject RagIntegrationService here
    // For now, simplified inline injection:
    prompt = this.injectRAGContext(prompt, ragResults, ragWeight);
  }

  // Rest of existing implementation...
  // (keep all existing code)
}

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

  return `# Retrieved Training Materials

${ragContext}

# Your Task

Using the above as reference, ${basePrompt}`;
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
```

---

## Phase 2: Frontend Integration (Week 2)

### 2.1 Create Variant Selector Component

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
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  onSelect,
  onSaveForLater,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Generating 4 session variants...</p>
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
            <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm font-medium text-gray-900">
                {variant.outline.suggestedSessionTitle}
              </p>
              <p className="text-xs text-gray-500">
                {variant.outline.sections.length} sections • {variant.outline.totalDuration} min
              </p>

              {/* Mini section list */}
              <ul className="text-xs text-gray-600 space-y-1 mt-2">
                {variant.outline.sections.slice(0, 3).map((section: any) => (
                  <li key={section.id} className="truncate">
                    • {section.title} ({section.duration}m)
                  </li>
                ))}
                {variant.outline.sections.length > 3 && (
                  <li className="text-gray-400 italic">
                    + {variant.outline.sections.length - 3} more sections
                  </li>
                )}
              </ul>
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
  };
}
```

Add method:
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
```

---

### 2.3 Integrate into Session Builder Context

**File**: `packages/frontend/src/features/session-builder/state/SessionBuilderContext.tsx`

Add state:
```typescript
const [variants, setVariants] = useState<any[]>([]);
const [variantsStatus, setVariantsStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
```

Add action:
```typescript
const generateMultipleVariants = async () => {
  setVariantsStatus('pending');
  try {
    const response = await sessionBuilderService.generateMultipleOutlines(state.draft.metadata);
    setVariants(response.variants);
    setVariantsStatus('success');
  } catch (error) {
    console.error('Failed to generate variants', error);
    setVariantsStatus('error');
  }
};

const selectVariant = (variantId: string) => {
  const selected = variants.find(v => v.id === variantId);
  if (selected) {
    updateOutline(selected.outline);
    // Track selection for analytics
    if (selected.generationSource === 'rag') {
      trackEvent('variant_selected', { type: 'rag', weight: selected.ragWeight });
    } else {
      trackEvent('variant_selected', { type: 'baseline' });
    }
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
            We'll create 4 different session outlines for you to choose from.
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
    </div>
  );
```

---

## Phase 3: Testing & Validation (Week 3)

### 3.1 Manual Testing Checklist

#### Backend Testing
- [ ] RAG service connects to tribeRAG2 successfully
- [ ] RAG query returns results for test categories
- [ ] Smart weighting produces higher scores for recent + category-matched content
- [ ] All 4 variants generate without errors
- [ ] Duration balancing works correctly (test 30min, 90min, 180min)
- [ ] Variants have different RAG weights (0.8, 0.5, 0.2, 0.0)

#### Frontend Testing
- [ ] Variant selector displays all 4 cards correctly
- [ ] RAG badge shows on variants 1-2 only
- [ ] Labels and descriptions display properly
- [ ] "Select & Edit" navigates to review step with correct outline
- [ ] Loading state shows during generation
- [ ] Error state handles failures gracefully

#### Integration Testing
- [ ] End-to-end flow: input → generate → select → edit → publish
- [ ] Multiple sessions created successfully
- [ ] Different categories produce different RAG results
- [ ] Variant selection is tracked in analytics

---

### 3.2 Quality Validation

Generate **10 test sessions** across different categories:
1. Prospecting
2. Closing
3. Leadership Development
4. Product Training
5. Objection Handling

**Compare**:
- Do RAG variants feel more relevant to category?
- Are section suggestions more specific/actionable?
- Do durations balance correctly?
- Are learning objectives aligned with desired outcomes?

---

### 3.3 Edge Cases to Test

- [ ] RAG service is down → should generate 4 baseline variants
- [ ] No RAG results found → should warn user, proceed with AI-only
- [ ] Very short session (30min) → sections should still balance
- [ ] Very long session (4hr) → should have realistic section breakdown
- [ ] Missing optional fields (currentProblem, specificTopics) → should still work
- [ ] OpenAI rate limit hit → should retry and show helpful error

---

## Success Metrics

### Track After 20 Sessions Created

#### Quantitative
1. **Selection Rate**: Which variants do users pick?
   - Hypothesis: Variant 1 (RAG 80%) or Variant 2 (RAG 50%) chosen >50% of time

2. **Edit Depth**: Count edits made to each variant type
   - Hypothesis: RAG variants require fewer edits

3. **Time to Publish**: From variant selection to publish
   - Hypothesis: RAG users publish faster

4. **Readiness Score**: Compare final readiness scores
   - Hypothesis: RAG variants have higher initial readiness

#### Qualitative
1. **User Feedback Survey**: "Which variant was most helpful and why?"
2. **Trainer Feedback**: "Was the session usable as-is?"
3. **Content Review**: Manual comparison of RAG vs baseline quality

---

## Rollout Strategy

### Week 1-2: Development
- Build all components per plan above

### Week 3: Internal Testing
- Enable feature flag: `ENABLE_VARIANT_GENERATION_V2=true` for admins only
- Create 10-15 test sessions
- Gather internal feedback
- Refine RAG query template if needed

### Week 4: Limited Beta
- Enable for 10% of users (feature flag)
- Monitor metrics closely
- Fix any critical bugs

### Week 5+: Full Rollout
- If metrics positive (>50% RAG selection rate):
  - Enable for all users
  - Deprecate v1 endpoint eventually
- If metrics neutral/negative:
  - Iterate on RAG query/weighting
  - Or pivot to different enhancements

---

## Effort Estimate

| Phase | Backend | Frontend | Testing | Total |
|-------|---------|----------|---------|-------|
| Phase 1: Infrastructure | 10-12h | - | 2h | 12-14h |
| Phase 2: UI Integration | 2h | 6-8h | 2h | 10-12h |
| Phase 3: Testing | - | 1h | 4-6h | 5-7h |
| **Total** | **12-14h** | **7-9h** | **8-10h** | **27-33h** |

**Realistic Timeline**: 3-4 weeks at 8-10 hours/week

---

## What's Next (v2.1 and Beyond)

Once RAG effectiveness is proven, add:

### v2.1 Features
1. **Saved Ideas Entity** - Let users save variants for later
2. **Confirmation Page** - Post-publish workflow with Marketing/Trainer Kit CTAs
3. **Collections** - Organize saved ideas into themed groups

### v2.2+ Features
1. **Learn from Edits** - Track user edits to improve AI over time
2. **One-Click Hybrid** - Mix sections from multiple variants
3. **Advanced RAG Weighting** - Let users adjust RAG amount via slider
4. **Category-Specific Prompts** - Specialized templates per category

---

## Open Questions

1. **Environment**: Where is tribeRAG2 deployed? (localhost:8000 or remote?)
2. **RAG Categories**: Do tribeRAG2 categories match your session categories?
3. **Analytics**: What tool are you using to track variant selections?
4. **Feature Flag**: Do you have a feature flag system or should we use env var?
5. **Error Handling**: Preferred UX when all 4 variants fail to generate?

---

## Ready to Implement?

This MVP focuses on **proving RAG adds value** before building extensive infrastructure.

**Next Steps**:
1. Review this plan and answer open questions
2. Set up RAG_API_URL environment variable
3. Start with Phase 1 (backend infrastructure)
4. Test RAG quality with 5-10 manual queries
5. If RAG results look good → proceed to Phase 2
6. If RAG results are poor → refine query template first

**Key Decision Point**: After Phase 1, evaluate RAG result quality before investing in full UI.
