# AI Guidelines for Training Builder

## Overview

This document outlines guidelines for working with the AI module in the Training Builder application. The AI system provides contextual content generation, quality validation, and analytics tracking to enhance the session building experience.

## Architecture

### Core Components

- **AI Service** (`packages/backend/src/modules/ai/ai.service.ts`): Core AI functionality with contextual suggestions and quality checks
- **Analytics Telemetry** (`packages/backend/src/services/analytics-telemetry.service.ts`): Event tracking and metrics collection
- **Readiness Scoring** (`packages/backend/src/modules/sessions/services/readiness-scoring.service.ts`): Session publish readiness validation

### Key Features

1. **Contextual Prompt Enhancement**: Uses session metadata (topic, audience, objectives) to improve AI prompts
2. **Quality Moderation**: Validates AI outputs for length, tone, banned phrases, and structural requirements
3. **Analytics Tracking**: Records all AI interactions for performance monitoring and improvement
4. **Readiness Scoring**: Calculates session completeness and publishing eligibility

## API Usage

### Generate AI Content

```typescript
POST /api/ai/generate
{
  "sessionId": "string",
  "prompt": "string",
  "kind": "outline" | "opener" | "activity" | "content",
  "variables": {} // optional context variables
}
```

**Response:**
```typescript
{
  "sessionId": "string",
  "kind": "string",
  "prompt": "string", // enhanced with context
  "content": {}, // generated content
  "source": "ai-enhanced",
  "qualityCheck": {
    "passed": boolean,
    "issues": string[],
    "score": number
  },
  "metadata": {
    "generatedAt": "string",
    "processingTime": number,
    "contextUsed": boolean
  }
}
```

### Get Contextual Suggestions

```typescript
GET /api/ai/suggestions?sessionId=<id>&kind=<type>
```

**Response:**
```typescript
[
  {
    "id": "string",
    "text": "string",
    "category": "string",
    "relevanceScore": number
  }
]
```

### Check Session Readiness

```typescript
GET /api/sessions/<id>/readiness
```

**Response:**
```typescript
{
  "score": number,
  "maxScore": number,
  "percentage": number,
  "canPublish": boolean,
  "checks": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "passed": boolean,
      "weight": number,
      "category": "content" | "metadata" | "assignment" | "integration"
    }
  ],
  "recommendedActions": string[]
}
```

## Quality Standards

### Content Requirements

- **Minimum Length**: 10 characters for any generated content
- **Maximum Length**: 5000 characters to prevent overwhelming users
- **Professional Tone**: Avoids excessive superlatives or inappropriate language
- **Structure Validation**: Ensures required fields are present based on content type

### Banned Phrases

The system automatically rejects content containing:
- "placeholder", "lorem ipsum", "todo", "fix me"
- Other development-specific placeholders

### Quality Scoring

Content quality is scored 0-100 based on:
- Structure compliance (50 points)
- Length appropriateness (20 points)
- Tone professionalism (25 points)
- Banned phrase absence (15 points)

Minimum passing score: **70/100**

## Frontend Integration

### Using AI in Components

```typescript
import { aiService } from '../services/ai.service';

// Generate content
const result = await aiService.generateContent({
  sessionId: 'session-id',
  prompt: 'Create an opening activity for leadership training',
  kind: 'opener'
});

// Get suggestions
const suggestions = await aiService.getContextualSuggestions('session-id', 'opener');

// Record user interactions
aiService.recordContentAcceptance('session-id', 'content-id');
aiService.recordContentRejection('session-id', 'content-id', 'not-relevant');
```

### Session Builder Integration

The AI module integrates with the session builder through:

1. **Contextual Suggestions**: Displayed in prompt interface based on current session state
2. **Quality Validation**: Real-time feedback on generated content quality
3. **Readiness Indicators**: Visual feedback on session completeness and publish eligibility
4. **Analytics Dashboard**: Usage metrics and performance insights

## Analytics & Monitoring

### Tracked Events

- `ai_prompt_submitted`: User submits prompt for generation
- `ai_content_generated`: AI successfully generates content
- `ai_content_accepted`: User accepts generated content
- `ai_content_rejected`: User rejects generated content
- `session_published`: Session moves to published status
- `builder_opened`: User opens session builder
- `content_edited`: User manually edits content

### Key Metrics

1. **AI Performance**
   - Prompt success rate
   - Average processing time
   - Quality score distribution
   - Top content categories

2. **Builder Usage**
   - Session creation rate
   - AI adoption percentage
   - Average build time
   - Publish completion rate

### Dashboard Access

Analytics dashboard available at `/analytics` for users with appropriate permissions.

## Best Practices

### For Developers

1. **Error Handling**: Always wrap AI calls in try-catch blocks
2. **User Feedback**: Provide clear feedback for quality check failures
3. **Context Preservation**: Pass session context to improve AI relevance
4. **Analytics Integration**: Record user interactions for continuous improvement

### For Content Quality

1. **Prompt Engineering**: Use specific, context-rich prompts
2. **Iterative Refinement**: Allow users to refine prompts based on initial results
3. **Human Oversight**: Encourage users to review and edit AI-generated content
4. **Version Control**: Maintain content version history for rollback capability

### For Performance

1. **Caching**: Implement response caching for repeated similar prompts
2. **Async Processing**: Use async/await patterns to prevent blocking
3. **Rate Limiting**: Implement reasonable limits to prevent system overload
4. **Error Recovery**: Provide fallback options when AI services are unavailable

## Troubleshooting

### Common Issues

1. **Quality Check Failures**
   - Check content length (10-5000 characters)
   - Review for banned phrases
   - Ensure appropriate professional tone
   - Verify structural requirements for content type

2. **Context Not Applied**
   - Verify session has required metadata (topic, audience, objectives)
   - Check session relationships (trainer assignments, landing pages)
   - Ensure proper session loading with relations

3. **Analytics Not Recording**
   - Verify telemetry service is properly injected
   - Check console for telemetry event logs
   - Ensure user ID is passed to tracking methods

### Debug Mode

Enable detailed logging in development:

```typescript
// In .env
NODE_ENV=development
AI_DEBUG_LOGGING=true
```

## Security Considerations

1. **Input Validation**: All prompts are sanitized before processing
2. **Output Filtering**: Generated content is checked for inappropriate material
3. **User Authorization**: AI endpoints respect role-based access controls
4. **Data Privacy**: Analytics data is anonymized and retained per policy

## Future Enhancements

1. **Real AI Integration**: Replace placeholder content generation with actual AI services
2. **Advanced Personalization**: Use historical user preferences for better suggestions
3. **Collaborative Features**: Enable team-based content review and approval
4. **Integration Extensions**: Connect with external content libraries and resources

## Support

For questions or issues with AI functionality:

1. Check this documentation first
2. Review console logs for error details
3. Test with minimal examples to isolate issues
4. Report bugs with session context and reproduction steps

---

*Last Updated: September 2024*
*Version: 1.0*