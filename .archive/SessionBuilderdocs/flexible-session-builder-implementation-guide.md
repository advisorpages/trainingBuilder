# Flexible Session Builder - Implementation Guide

## Quick Start

This guide shows how the flexible session builder works end-to-end, how to extend it (e.g., add new section types), and how to use the backend APIs and frontend helpers.

## Code Structure

```
packages/backend/src/modules/sessions/
├── interfaces/
│   └── session-outline.interface.ts      # Core types (Flexible + Legacy)
├── utils/
│   └── session-outline.utils.ts          # Section configs, defaults, validation, conversion
├── services/
│   └── session-builder.service.ts        # Orchestration, RAG/topics, outline operations
├── controllers/
│   └── session-builder.controller.ts     # REST API endpoints (guarded)
└── dto/
    └── session-builder.dto.ts            # Request/response DTOs

packages/backend/src/modules/ai/
└── ai.service.ts                         # AI generation (legacy + flexible)

packages/frontend/src/services/
└── session-builder.service.ts            # API client + helpers (create/update/validate)

packages/frontend/src/components/session-builder/
├── SessionOutlineDisplay.tsx             # Read-only flexible outline display
└── SessionOutlineEditor.tsx              # Legacy editor (compatibility)
```

## Key Files and Their Purpose

### 1. Core Interface Definition
**File:** `packages/backend/src/modules/sessions/interfaces/session-outline.interface.ts`

```typescript
// This is the main flexible structure
export interface SessionOutline extends FlexibleSessionOutline {}

export interface FlexibleSessionOutline {
  sections: FlexibleSessionSection[];
  totalDuration: number;
  suggestedSessionTitle: string;
  suggestedDescription: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  recommendedAudienceSize: string;
  ragSuggestions?: any;
  fallbackUsed: boolean;
  generatedAt: Date;
}

export interface FlexibleSessionSection {
  id: string;
  type: 'opener' | 'topic' | 'exercise' | 'inspiration' | 'closing' |
        'video' | 'discussion' | 'presentation' | 'break' | 'assessment' | 'custom';
  position: number;
  title: string;
  duration: number;
  description: string;
  isRequired?: boolean;
  isCollapsible?: boolean;
  icon?: string;

  // Type-specific properties (optional based on section type)
  learningObjectives?: string[];
  materialsNeeded?: string[];
  exerciseInstructions?: string;
  exerciseType?: 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play' | 'presentation' | 'reflection' | 'assessment' | 'group-work';
  inspirationType?: 'video' | 'story' | 'quote' | 'case-study' | 'audio' | 'image' | 'external-link';
  keyTakeaways?: string[];
  actionItems?: string[];
  suggestions?: string[];
  discussionPrompts?: string[];
  mediaUrl?: string;
  mediaDuration?: number;
  engagementType?: 'individual' | 'pairs' | 'small-groups' | 'full-group';
  assessmentType?: 'quiz' | 'reflection' | 'peer-review' | 'self-assessment';
  assessmentCriteria?: string[];
  learningOutcomes?: string;
  trainerNotes?: string;
  deliveryGuidance?: string;
  // ... more properties
}
```

**Key Points:**
- `FlexibleSessionSection` is the core building block
- `type` field determines what properties are available
- `position` controls ordering (1-based)
- `id` must be unique within a session

### 2. Utility Functions
**File:** `packages/backend/src/modules/sessions/utils/session-outline.utils.ts`

```typescript
export class SessionOutlineUtils {
  // Get configuration for all section types
  static getSectionTypeConfigs(): Record<SectionType, SectionTypeConfig>

  // Create a new section with defaults
  static createDefaultSection(type: SectionType, position: number): FlexibleSessionSection

  // Get the default template (replicates old structure)
  static getDefaultTemplate(): SessionTemplate

  // Convert legacy format to flexible format
  static convertLegacyToFlexible(legacy: SessionOutlineLegacy): FlexibleSessionOutline

  // Validation
  static validateSection(section: FlexibleSessionSection): { isValid: boolean; errors: string[] }

  // Helper functions
  static sortSectionsByPosition(sections: FlexibleSessionSection[]): FlexibleSessionSection[]
  static updateSectionPositions(sections: FlexibleSessionSection[]): FlexibleSessionSection[]
  static calculateTotalDuration(sections: FlexibleSessionSection[]): number
}
```

**Usage Example:**
```typescript
// Create a new exercise section at position 3
const newSection = SessionOutlineUtils.createDefaultSection('exercise', 3);

// Validate a section
const validation = SessionOutlineUtils.validateSection(section);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

### 3. Main Service Logic
**File:** `packages/backend/src/modules/sessions/services/session-builder.service.ts`

**Key Methods:**

```typescript
// Generate flexible outline (primary method)
async generateSessionOutline(
  request: SuggestSessionOutlineDto,
  useTemplate?: string
): Promise<SessionOutlineResult>

// Generate legacy format (backward compatibility)
async generateLegacySessionOutline(
  request: SuggestSessionOutlineDto
): Promise<SessionOutlineResult>

// Template management
async getTemplates(): Promise<SessionTemplate[]>
async getTemplate(templateId: string): Promise<SessionTemplate>
async createCustomTemplate(name: string, description: string, sections: FlexibleSessionSection[]): Promise<SessionTemplate>

// Section management
async addSectionToOutline(outline: FlexibleSessionOutline, sectionType: string, position?: number): Promise<FlexibleSessionOutline>
async removeSectionFromOutline(outline: FlexibleSessionOutline, sectionId: string): Promise<FlexibleSessionOutline>
async updateSectionInOutline(outline: FlexibleSessionOutline, sectionId: string, updates: Partial<FlexibleSessionSection>): Promise<FlexibleSessionOutline>
async reorderSections(outline: FlexibleSessionOutline, sectionIds: string[]): Promise<FlexibleSessionOutline>
async duplicateSection(outline: FlexibleSessionOutline, sectionId: string): Promise<FlexibleSessionOutline>

// Validation
async validateOutline(outline: FlexibleSessionOutline): Promise<{ isValid: boolean; errors: string[] }>
```

### 4. API Endpoints
**File:** `packages/backend/src/modules/sessions/controllers/session-builder.controller.ts`

```typescript
// Generate flexible outline (with optional template)
@Post('suggest-outline')
async suggestOutline(@Body() dto: SuggestSessionOutlineDto, @Query('template') templateId?: string)

// Legacy format generation
@Post('suggest-legacy-outline')
async suggestLegacyOutline(@Body() dto: SuggestSessionOutlineDto)

// Template management
@Get('templates')
async getTemplates(): Promise<SessionTemplate[]>

@Get('templates/:templateId')
async getTemplate(@Param('templateId') templateId: string): Promise<SessionTemplate>

@Post('templates')
async createTemplate(@Body() templateData: { name: string; description: string; sections: FlexibleSessionSection[] })

// Section operations
@Put('outlines/sections/add')
async addSection(@Body() data: { outline: FlexibleSessionOutline; sectionType: string; position?: number })

@Put('outlines/sections/remove')
async removeSection(@Body() data: { outline: FlexibleSessionOutline; sectionId: string })

@Put('outlines/sections/update')
async updateSection(@Body() data: { outline: FlexibleSessionOutline; sectionId: string; updates: Partial<FlexibleSessionSection> })

@Put('outlines/sections/reorder')
async reorderSections(@Body() data: { outline: FlexibleSessionOutline; sectionIds: string[] })
 
@Put('outlines/sections/duplicate')
async duplicateSection(@Body() data: { outline: FlexibleSessionOutline; sectionId: string })

@Post('outlines/validate')
async validateOutline(@Body() outline: FlexibleSessionOutline)
```

Note: Endpoints are protected by `JwtAuthGuard` and `RolesGuard` and require roles `CONTENT_DEVELOPER` or `BROKER`.

## How to Add New Section Types

### Step 1: Update the Type Union
In `session-outline.interface.ts`:
```typescript
export interface FlexibleSessionSection {
  // Add your new type here
  type: 'opener' | 'topic' | 'exercise' | '...' | 'your-new-type';

  // Add type-specific properties
  yourCustomProperty?: string;
  yourCustomArray?: string[];
}
```

### Step 2: Add Section Type Configuration
In `session-outline.utils.ts`:
```typescript
static getSectionTypeConfigs(): Record<SectionType, SectionTypeConfig> {
  return {
    // ... existing types
    'your-new-type': {
      type: 'your-new-type',
      name: 'Your New Type',
      icon: '🔥', // Choose appropriate emoji
      description: 'Description of what this section type does',
      defaultDuration: 20, // Default duration in minutes
      requiredFields: ['title', 'description', 'duration', 'yourCustomProperty'],
      availableFields: ['yourCustomArray', 'learningObjectives', 'trainerNotes']
    }
  };
}
```

### Step 3: Update Default Section Creation
In `session-outline.utils.ts`:
```typescript
static createDefaultSection(type: SectionType, position: number): FlexibleSessionSection {
  const config = this.getSectionTypeConfigs()[type];
  const baseSection = {
    id: uuidv4(),
    type,
    position,
    title: `New ${config.name}`,
    duration: config.defaultDuration,
    description: `Add description for this ${config.name.toLowerCase()}`,
    icon: config.icon,
    isCollapsible: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Add type-specific defaults
  if (type === 'your-new-type') {
    return {
      ...baseSection,
      yourCustomProperty: 'default value',
      yourCustomArray: []
    };
  }

  return baseSection;
}
```

### Step 4: Update Frontend Service
In `packages/frontend/src/services/session-builder.service.ts`:
```typescript
// Update the interface to match backend
export interface FlexibleSessionSection {
  type: 'opener' | 'topic' | '...' | 'your-new-type';
  yourCustomProperty?: string;
  yourCustomArray?: string[];
}

// Update the createDefaultSection method
createDefaultSection(type: SectionType, position: number): FlexibleSessionSection {
  // Add case for your new type
  switch (type) {
    case 'your-new-type':
      return {
        ...baseSection,
        icon: '🔥',
        yourCustomProperty: 'default value',
        yourCustomArray: []
      };
  }
}
```

### Step 5: Update Frontend Display Component
In `SessionOutlineDisplay.tsx`:
```typescript
const getIconForSection = (section: FlexibleSessionSection): React.ReactNode => {
  const iconMap = {
    // ... existing types
    'your-new-type': { emoji: '🔥', bgColor: 'bg-orange-100', textColor: 'text-orange-600' }
  };
}

const FlexibleSectionCard: React.FC<{ section: FlexibleSessionSection }> = ({ section }) => (
  <div>
    {/* ... existing rendering */}

    {/* Add custom rendering for your section type */}
    {section.type === 'your-new-type' && (
      <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
        <h4 className="font-medium text-orange-900 mb-2">Your Custom Section:</h4>
        {section.yourCustomProperty && (
          <p className="text-orange-800 text-sm">{section.yourCustomProperty}</p>
        )}
        {section.yourCustomArray && section.yourCustomArray.length > 0 && (
          <ul className="list-disc list-inside">
            {section.yourCustomArray.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    )}
  </div>
);
```

## API Usage Examples

### Generate Flexible Outline
```
POST /sessions/builder/suggest-outline?template=session-outline-generator
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "category": "Leadership",
  "sessionType": "workshop",
  "desiredOutcome": "Improve team motivation",
  "currentProblem": "Low morale",
  "specificTopics": "coaching, feedback",
  "date": "2025-10-01",
  "startTime": "2025-10-01T09:00:00Z",
  "endTime": "2025-10-01T11:00:00Z"
}
```

### Add/Update/Validate Sections
```
PUT /sessions/builder/outlines/sections/add
{ "outline": <FlexibleSessionOutline>, "sectionType": "exercise", "position": 3 }

PUT /sessions/builder/outlines/sections/update
{ "outline": <FlexibleSessionOutline>, "sectionId": "id-123", "updates": { "duration": 25 } }

PUT /sessions/builder/outlines/sections/reorder
{ "outline": <FlexibleSessionOutline>, "sectionIds": ["id-1","id-3","id-2"] }

PUT /sessions/builder/outlines/sections/duplicate
{ "outline": <FlexibleSessionOutline>, "sectionId": "id-2" }

POST /sessions/builder/outlines/validate
<FlexibleSessionOutline>
```

## Frontend Helpers

Key methods in `packages/frontend/src/services/session-builder.service.ts`:
- `generateSessionOutline(input, templateId?)` calls backend and returns `SessionOutlineResponse`.
- `createDefaultSection(type, position)` returns a typed default section.
- `addSection/removeSection/updateSection/reorderSections/duplicateSection/validateOutline` wrap API endpoints.
- `sortSectionsByPosition` and `calculateTotalDuration` assist with UI sorting and totals.

Components:
- `SessionOutlineDisplay.tsx` renders flexible outlines and includes icons and rich properties per section type.
- `SessionOutlineEditor.tsx` is legacy-structure specific; use Display + service methods for flexible flows.

## AI Service Integration

To make your section type work with AI generation:

```typescript
// In ai.service.ts
async generateFlexibleSessionOutline(/* params */): Promise<SessionOutline> {
  // Add logic to determine when to use your new section type
  if (request.category === 'special-category') {
    sections.push({
      id: uuidv4(),
      type: 'your-new-type',
      position: sections.length + 1,
      title: this.generateTitleForNewType(request),
      duration: 20,
      description: this.generateDescriptionForNewType(request),
      yourCustomProperty: this.generateCustomProperty(request)
    });
  }
}
```

## Common Pitfalls and Solutions

### 1. Position Management
**Problem:** Section positions get out of sync
**Solution:** Always use `updateSectionPositions()` after array operations

```typescript
// Wrong
sections.splice(1, 0, newSection);

// Right
sections.splice(1, 0, newSection);
sections = SessionOutlineUtils.updateSectionPositions(sections);
```

### 2. Type Safety
**Problem:** TypeScript errors with new properties
**Solution:** Use type guards and optional properties

```typescript
// Type guard
function isYourNewTypeSection(section: FlexibleSessionSection): section is FlexibleSessionSection & { yourCustomProperty: string } {
  return section.type === 'your-new-type' && 'yourCustomProperty' in section;
}

// Usage
if (isYourNewTypeSection(section)) {
  console.log(section.yourCustomProperty); // TypeScript knows this exists
}
```

### 3. Migration Issues
**Problem:** Legacy data doesn't convert properly
**Solution:** Use `SessionOutlineUtils.convertLegacyToFlexible()` and add error handling/fallbacks

```typescript
private convertLegacyToFlexible(legacy: any): any {
  try {
    // Validate input
    if (!legacy || typeof legacy !== 'object') {
      throw new Error('Invalid legacy format');
    }

    // Convert with fallbacks
    const sections = [];
    if (legacy.opener) {
      sections.push(this.convertSection(legacy.opener, 'opener'));
    }

    return { sections, /* ... other mapped fields ... */ };
  } catch (error) {
    console.error('Conversion failed:', error);
    return this.createFallbackOutline();
  }
}
```

## Performance Optimization Tips

### 1. Frontend Rendering
```typescript
// Use React.memo for section components
const FlexibleSectionCard = React.memo<{ section: FlexibleSessionSection }>(({ section }) => {
  // Component implementation
});

// Use useCallback for event handlers
const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<FlexibleSessionSection>) => {
  // Update logic
}, [outline]);
```

### 2. Backend Queries
```typescript
// Use projection to avoid loading unnecessary data
const sessions = await this.sessionRepository.find({
  select: ['id', 'title', 'sessionOutlineData'],
  where: { /* conditions */ }
});

// Optional: consider JSONB indexes when persisting outlines (Postgres):
// CREATE INDEX IF NOT EXISTS idx_sections_type ON sessions USING gin ((session_outline_data->'sections'));
```

## Debugging Tips

### 1. Console Logging
```typescript
// Add debugging to service methods
async addSectionToOutline(outline: FlexibleSessionOutline, sectionType: string, position?: number) {
  console.log(`Adding section: type=${sectionType}, position=${position}, existing=${outline.sections.length}`);

  const result = /* ... */;

  console.log(`Result: ${result.sections.length} sections, positions:`, result.sections.map(s => s.position));
  return result;
}
```

### 2. Validation Checks
```typescript
// Add validation assertions
function validateOutlineIntegrity(outline: FlexibleSessionOutline) {
  const positions = outline.sections.map(s => s.position).sort((a, b) => a - b);
  const expectedPositions = Array.from({ length: positions.length }, (_, i) => i + 1);

  if (JSON.stringify(positions) !== JSON.stringify(expectedPositions)) {
    throw new Error(`Invalid positions: ${positions.join(',')}, expected: ${expectedPositions.join(',')}`);
  }
}
```

## End-to-End Flow

- Frontend calls `generateSessionOutline` with category/sessionType and times; backend orchestrates RAG availability, topic lookup, and AI generation via `AIService.generateFlexibleSessionOutline` seeded by `SessionOutlineUtils.getDefaultTemplate()`.
- Client renders with `SessionOutlineDisplay` and manipulates the outline via section endpoints (`add/update/reorder/duplicate`), validating with `outlines/validate`.
- When approved, client invokes `createSessionFromOutline()` to persist a session; outline is stored in `sessionOutlineData` alongside AI metadata.

This guide equips you to understand, extend, and debug the flexible session builder effectively.
