# AI Content Generation Reference Guide

This guide provides developers with all the required inputs and expected outputs for AI content generation across Sessions, Topics, Incentives, and Landing Pages. Use this reference to understand what data to provide and what to expect back from AI processing.

## Table of Contents

- [Sessions](#sessions)
- [Topics](#topics)
- [Incentives](#incentives)
- [Landing Pages](#landing-pages)
- [Database Storage Patterns](#database-storage-patterns)
- [Common Field Mappings](#common-field-mappings)

---

## Sessions

### Required Inputs (Before AI Processing)

**Core Required Fields:**
```typescript
{
  title: string,           // Session title (required, max 255 chars)
  startTime: Date,         // Start date/time (required)
  endTime: Date,           // End date/time (required, must be after startTime)
  maxRegistrations: number // Maximum participants (required, min 1, default 50)
}
```

**Optional Descriptive Fields:**
```typescript
{
  description?: string,    // Session description (optional, max 2000 chars)
}
```

**Resource Assignment Fields (All Optional):**
```typescript
{
  locationId?: number,     // Training location reference
  trainerId?: number,      // Assigned trainer reference
  audienceId?: number,     // Target audience reference
  toneId?: number,         // Communication tone reference
  categoryId?: number,     // Training category reference
  topicIds?: number[]      // Array of topic IDs (many-to-many relationship)
}
```

**System-Generated Fields:**
```typescript
{
  authorId: string,        // UUID of user creating the session
  status: 'draft',         // Initial status
  isActive: true           // Active flag
}
```

### Expected AI Output JSON Format

The AI generates marketing content using the prompt in `config/ai-prompts/session-marketing-copy.md` and returns this exact JSON structure:

```json
{
  "headlines": [
    "Primary compelling headline for hero section",
    "Alternative headline option",
    "Third headline variation"
  ],
  "subheadlines": [
    "Supporting subheadline that elaborates on main headline",
    "Alternative subheadline with different angle",
    "Third subheadline option"
  ],
  "description": "Long-form session description (2-3 paragraphs) for detailed listings. Comprehensive overview of what attendees will learn and experience.",
  "socialMedia": [
    "Twitter/LinkedIn post 1 - engaging and shareable with hashtags",
    "Professional LinkedIn post with business focus and call-to-action",
    "Twitter post with excitement and registration urgency"
  ],
  "emailCopy": "Complete email marketing campaign including subject line concepts and full email body text that encourages registration and shares session value.",
  "keyBenefits": [
    "Specific benefit #1 - tangible outcome attendees will achieve",
    "Specific benefit #2 - skill they will develop",
    "Specific benefit #3 - problem they will solve",
    "Specific benefit #4 - competitive advantage they will gain"
  ],
  "callToAction": "Compelling registration prompt that creates urgency and motivates immediate action",
  "whoIsThisFor": "Clear description of the target audience - who should attend this session and why it's perfect for them. Be specific about roles, challenges, or goals.",
  "whyAttend": "Compelling reasons why someone should prioritize attending this session over other activities. Focus on unique value proposition and outcomes.",
  "topicsAndBenefits": [
    "Topic 1: Specific topic with clear benefit explanation",
    "Topic 2: Specific topic with clear benefit explanation",
    "Topic 3: Specific topic with clear benefit explanation",
    "Topic 4: Specific topic with clear benefit explanation"
  ],
  "emotionalCallToAction": "Emotionally compelling call-to-action that connects with attendees' aspirations, fears, or desires. Should inspire action beyond just logical benefits.",
  "heroHeadline": "Primary headline optimized specifically for the hero section of the landing page",
  "heroSubheadline": "Supporting subheadline for the hero section that works with the main headline",
  "registrationFormCTA": "Specific text for the registration form button (e.g., 'Save My Spot', 'Reserve My Seat', 'Join This Session')"
}
```

### Database Storage for Sessions

**Complete JSON in `ai_generated_content` field:**
- Stored as JSONB in the `sessions` table
- Preserves the full AI response for future reference

**Extracted fields in individual columns:**
```sql
promotional_headline TEXT,      -- headlines[0] from AI response
promotional_summary TEXT,       -- description from AI response
key_benefits TEXT,              -- JSON.stringify(keyBenefits) from AI response
call_to_action TEXT,            -- callToAction from AI response
social_media_content TEXT,      -- socialMedia[0] from AI response
email_marketing_content TEXT    -- emailCopy from AI response
```

---

## Topics

### Required Inputs (Before AI Processing)

**Core Required Fields:**
```typescript
{
  name: string,           // Topic name (required, unique)
  learningOutcome: string // What participants will achieve/learn (required for AI)
}
```

**Optional Descriptive Fields:**
```typescript
{
  description?: string,   // Topic description (optional)
}
```

**AI Enhancement Context Fields (Required for AI Processing):**
```typescript
{
  audienceId: number,     // Target audience reference (required for AI)
  toneId: number,         // Communication tone reference (required for AI)
  categoryId: number,     // Training category reference (required for AI)
  deliveryStyle?: 'workshop' | 'presentation' | 'discussion', // Default: 'workshop'
  specialConsiderations?: string, // Optional special requirements
  sessionContext?: {      // Optional session integration context
    sessionTitle?: string,
    sessionDescription?: string,
    existingTopics?: string[]
  }
}
```

**System-Generated Fields:**
```typescript
{
  isActive: true,         // Active status (default)
  createdAt/updatedAt: Date // Timestamps
}
```

### Expected AI Output JSON Format

The AI generates comprehensive training content using the dual-purpose prompt (for both attendees and trainers) and returns this exact JSON structure:

```json
{
  "enhancedName": "Enhanced, compelling topic name for the target audience",
  "attendeeSection": {
    "whatYoullLearn": "Clear description of what participants will learn and be able to DO",
    "whoThisIsFor": "Target audience description with prerequisites and experience level",
    "keyTakeaways": [
      "Measurable takeaway 1",
      "Measurable takeaway 2",
      "Measurable takeaway 3",
      "Measurable takeaway 4"
    ],
    "prerequisites": "Required background knowledge or experience"
  },
  "trainerSection": {
    "deliveryFormat": "Recommended teaching approach and format",
    "preparationGuidance": "What trainers need to review and prepare beforehand",
    "keyTeachingPoints": [
      "Critical teaching point 1",
      "Critical teaching point 2",
      "Critical teaching point 3"
    ],
    "recommendedActivities": [
      "Specific activity or exercise 1",
      "Specific activity or exercise 2",
      "Specific activity or exercise 3"
    ],
    "materialsNeeded": [
      "Required material 1",
      "Required material 2",
      "Required material 3"
    ],
    "commonChallenges": [
      "Common challenge 1 and how to address it",
      "Common challenge 2 and how to address it"
    ],
    "assessmentSuggestions": [
      "Assessment method 1",
      "Assessment method 2"
    ]
  }
}
```

### Database Storage for Topics

**Complete JSON in `ai_generated_content` field:**
- Stored as JSONB in the `topics` table
- Preserves the full AI enhancement data with metadata

**Extracted fields in individual columns:**
```sql
learning_outcomes TEXT,     -- attendeeSection.keyTakeaways formatted as bullet points
trainer_notes TEXT,         -- preparationGuidance + keyTeachingPoints
materials_needed TEXT,      -- materialsNeeded as bullet points
delivery_guidance TEXT      -- deliveryFormat + recommendedActivities
```

---

## Incentives

### Required Inputs (Before AI Processing)

**Core Required Fields:**
```typescript
{
  title: string,           // Incentive title (required)
  startDate: Date,         // Start date (required)
  endDate: Date,           // End date (required, must be after startDate)
}
```

**Optional Descriptive Fields:**
```typescript
{
  description?: string,    // Incentive description (optional)
  rules?: string,          // Rules and conditions (optional)
}
```

**Resource Assignment Fields (All Optional):**
```typescript
{
  audienceId?: number,     // Target audience reference
  toneId?: number,         // Communication tone reference
  categoryId?: number,     // Category reference
}
```

**System-Generated Fields:**
```typescript
{
  authorId: string,        // UUID of user creating the incentive
  status: 'draft',         // Initial status
  isActive: true           // Active flag
}
```

### Expected AI Output JSON Format

The AI generates promotional content for incentives and returns this structure:

```json
{
  "content": {
    "title": "Enhanced promotional title with urgency indicators",
    "shortDescription": "Brief promotional description with key value proposition",
    "longDescription": "Detailed promotional description with benefits and urgency",
    "rulesText": "Formatted rules and conditions with clear terms",
    "socialCopy": "Social media post with emojis, hashtags, and call-to-action",
    "emailCopy": "Complete email campaign with subject line and full body text"
  },
  "generatedAt": "2025-01-15T10:30:00.000Z",
  "model": "gpt-4",
  "totalTokensUsed": 450,
  "version": 1
}
```

### Database Storage for Incentives

**Complete JSON in `ai_generated_content` field:**
- Stored as JSONB in the `incentives` table
- Contains the full content object with metadata

---

## Landing Pages

### Required Inputs (Before AI Processing)

Landing pages are generated from session data and don't have separate input requirements. They use the AI-generated content from sessions.

**Source Data from Sessions:**
```typescript
{
  sessionTitle: string,
  sessionDescription: string,
  startTime: Date,
  endTime: Date,
  maxRegistrations: number,
  locationName?: string,
  trainerName?: string,
  aiGeneratedContent: {    // From session's AI content
    heroHeadline: string,
    heroSubheadline: string,
    description: string,
    keyBenefits: string[],
    callToAction: string,
    registrationFormCTA: string
  }
}
```

### Expected AI Output JSON Format

Landing pages use the session marketing copy AI output format (same as Sessions above).

### Database Storage for Landing Pages

Landing pages are typically generated dynamically from session data and don't have dedicated database storage. The AI content is stored in the session record.

---

## Database Storage Patterns

### JSONB Storage Pattern
All AI-generated content follows this pattern:

```sql
-- Complete AI response stored as JSONB
ai_generated_content JSONB,

-- Individual extracted fields for easy querying
field1 TEXT,
field2 TEXT,
field3 TEXT,
-- etc.
```

### Common Field Mappings

**Sessions:**
- `ai_generated_content` → Full JSON response
- `promotional_headline` → `headlines[0]`
- `promotional_summary` → `description`
- `key_benefits` → `JSON.stringify(keyBenefits)`
- `call_to_action` → `callToAction`
- `social_media_content` → `socialMedia[0]`
- `email_marketing_content` → `emailCopy`

**Topics:**
- `ai_generated_content` → Full JSON response
- `learning_outcomes` → `attendeeSection.keyTakeaways` (formatted)
- `trainer_notes` → `trainerSection.preparationGuidance + keyTeachingPoints`
- `materials_needed` → `trainerSection.materialsNeeded` (formatted)
- `delivery_guidance` → `trainerSection.deliveryFormat + recommendedActivities`

**Incentives:**
- `ai_generated_content` → Full content object with metadata

---

## Quick Reference for Developers

### Creating Records with AI Content

**1. Sessions:**
```typescript
// Create session first
const session = await sessionService.create({
  title: "Leadership Workshop",
  startTime: new Date(),
  endTime: new Date(),
  maxRegistrations: 50,
  audienceId: 1,
  toneId: 1,
  categoryId: 1
});

// Then generate AI content
const aiContent = await aiService.generateContent({
  sessionData: session,
  contentTypes: ['headline', 'description', 'social_media', 'email_copy']
});

// Update session with AI content
await sessionService.update(session.id, {
  aiGeneratedContent: aiContent,
  promotionalHeadline: aiContent.headlines?.[0],
  promotionalSummary: aiContent.description,
  // ... other extracted fields
});
```

**2. Topics:**
```typescript
// Create topic first
const topic = await topicService.create({
  name: "Conflict Resolution",
  learningOutcome: "Learn to manage workplace conflicts effectively"
});

// Then enhance with AI
const aiContent = await aiTopicService.enhanceTopic({
  name: topic.name,
  learningOutcome: topic.learningOutcome,
  audienceId: 1,
  toneId: 1,
  categoryId: 1
});

// Update topic with AI content
await topicService.update(topic.id, {
  aiGeneratedContent: aiContent,
  learningOutcomes: extractLearningOutcomes(aiContent),
  trainerNotes: extractTrainerNotes(aiContent),
  // ... other extracted fields
});
```

**3. Incentives:**
```typescript
// Create incentive first
const incentive = await incentiveService.create({
  title: "Early Bird Discount",
  startDate: new Date(),
  endDate: new Date(),
  audienceId: 1,
  toneId: 1,
  categoryId: 1
}, user);

// Then generate AI content
const aiContent = await incentiveAIService.generateContent({
  title: incentive.title,
  description: incentive.description,
  startDate: incentive.startDate,
  endDate: incentive.endDate,
  audience: incentive.audience,
  tone: incentive.tone,
  category: incentive.category
});

// Update incentive with AI content
await incentiveService.update(incentive.id, {
  aiGeneratedContent: aiContent.content
}, user);
```

### Validation Before AI Processing

**Sessions:**
- Title, startTime, endTime, maxRegistrations required
- At least one of: audience, tone, category, topics recommended

**Topics:**
- Name and learningOutcome required
- Audience, tone, category required for meaningful AI output

**Incentives:**
- Title, startDate, endDate required
- Description and rules improve AI output quality

### Error Handling

**Common AI Processing Errors:**
- Missing required fields → `BadRequestException`
- Invalid date ranges → `BadRequestException`
- AI service unavailable → `InternalServerErrorException`
- Invalid JSON response → Parse errors

**Fallback Strategies:**
- Store partial data when AI fails
- Use default templates for missing content
- Allow manual content entry as backup

This guide should provide everything needed to work with AI content generation across all entity types in the system.