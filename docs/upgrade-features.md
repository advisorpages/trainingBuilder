# Feature Upgrade: AI Content Persistence During Session Editing

## Problem Statement

Currently, when users create sessions and generate AI content, this content disappears when they return to edit the session later. This is a critical UX issue that prevents users from iterating on their AI-generated content and reduces the value of the AI features.

## Root Cause Analysis

The issue occurs because:

1. **Frontend Form State**: The `SessionForm` component (`packages/frontend/src/components/sessions/SessionForm.tsx`) does not include AI-generated fields in its state management
2. **Auto-save Logic**: The auto-save functionality only preserves basic form fields, overwriting AI content with undefined values
3. **Backend Update Logic**: The partial update logic doesn't properly preserve existing AI content when form fields are updated

## Affected Fields

The following session fields are being lost during edit operations:
- `aiGeneratedContent` - Core AI-generated session content
- `promotionalHeadline` - AI-generated marketing headline
- `promotionalSummary` - AI-generated promotional description
- `keyBenefits` - AI-generated list of session benefits
- `callToAction` - AI-generated call-to-action text
- `socialMediaContent` - AI-generated social media copy
- `emailMarketingContent` - AI-generated email marketing content

## Solution Requirements

### Frontend Changes Required

#### 1. Update SessionForm Component (`packages/frontend/src/components/sessions/SessionForm.tsx`)

**Location**: Lines 64-76 (Form state initialization)
```typescript
// CURRENT - Missing AI fields
const [formData, setFormData] = useState({
  title: session?.title || '',
  description: session?.description || '',
  // ... basic fields only
});

// REQUIRED - Include AI content preservation
const [formData, setFormData] = useState({
  title: session?.title || '',
  description: session?.description || '',
  // ... existing basic fields
  // ADD: AI content preservation
  aiGeneratedContent: session?.aiGeneratedContent || null,
  promotionalHeadline: session?.promotionalHeadline || null,
  promotionalSummary: session?.promotionalSummary || null,
  keyBenefits: session?.keyBenefits || null,
  callToAction: session?.callToAction || null,
  socialMediaContent: session?.socialMediaContent || null,
  emailMarketingContent: session?.emailMarketingContent || null,
});
```

**Location**: Lines 193-205 (Auto-save submission data)
```typescript
// CURRENT - Only basic fields
const submissionData = {
  title: formData.title.trim() || undefined,
  description: formData.description.trim() || undefined,
  // ... basic fields only
};

// REQUIRED - Include AI content when it exists
const submissionData = {
  title: formData.title.trim() || undefined,
  description: formData.description.trim() || undefined,
  // ... existing basic fields
  // ADD: Preserve AI content if it exists
  ...(formData.aiGeneratedContent && { aiGeneratedContent: formData.aiGeneratedContent }),
  ...(formData.promotionalHeadline && { promotionalHeadline: formData.promotionalHeadline }),
  ...(formData.promotionalSummary && { promotionalSummary: formData.promotionalSummary }),
  ...(formData.keyBenefits && { keyBenefits: formData.keyBenefits }),
  ...(formData.callToAction && { callToAction: formData.callToAction }),
  ...(formData.socialMediaContent && { socialMediaContent: formData.socialMediaContent }),
  ...(formData.emailMarketingContent && { emailMarketingContent: formData.emailMarketingContent }),
};
```

**Location**: Lines 380-392 (Handle submit submission data)
```typescript
// CURRENT - Only basic fields in handleSubmit
const submissionData = {
  title: formData.title.trim(),
  description: formData.description.trim() || undefined,
  // ... basic fields only
};

// REQUIRED - Include AI content in manual submissions too
const submissionData = {
  title: formData.title.trim(),
  description: formData.description.trim() || undefined,
  // ... existing basic fields
  // ADD: Preserve AI content in manual saves
  ...(formData.aiGeneratedContent && { aiGeneratedContent: formData.aiGeneratedContent }),
  ...(formData.promotionalHeadline && { promotionalHeadline: formData.promotionalHeadline }),
  ...(formData.promotionalSummary && { promotionalSummary: formData.promotionalSummary }),
  ...(formData.keyBenefits && { keyBenefits: formData.keyBenefits }),
  ...(formData.callToAction && { callToAction: formData.callToAction }),
  ...(formData.socialMediaContent && { socialMediaContent: formData.socialMediaContent }),
  ...(formData.emailMarketingContent && { emailMarketingContent: formData.emailMarketingContent }),
};
```

### Backend Changes Required

#### 2. Update Sessions Service (`packages/backend/src/modules/sessions/sessions.service.ts`)

**Location**: Lines 189-196 (Auto-save update logic)
```typescript
// CURRENT - Overwrites with undefined values
Object.keys(partialData).forEach(key => {
  const value = partialData[key as keyof UpdateSessionDto];
  if (value !== undefined && value !== null && value !== '') {
    (updateData as any)[key] = value;
  }
});

// REQUIRED - Only update provided fields, preserve existing AI content
Object.keys(partialData).forEach(key => {
  const value = partialData[key as keyof UpdateSessionDto];
  // For most fields, only update if value is provided and not empty
  if (value !== undefined && value !== null && value !== '') {
    (updateData as any)[key] = value;
  }
  // For AI content fields, preserve explicit values including null
  const aiContentFields = [
    'aiGeneratedContent', 'promotionalHeadline', 'promotionalSummary',
    'keyBenefits', 'callToAction', 'socialMediaContent', 'emailMarketingContent'
  ];
  if (aiContentFields.includes(key) && partialData.hasOwnProperty(key)) {
    (updateData as any)[key] = value;
  }
});
```

#### 3. Update DTO to Include AI Fields (`packages/backend/src/modules/sessions/dto/update-session.dto.ts`)

Verify that the UpdateSessionDto includes all AI content fields:
```typescript
// VERIFY these fields exist in the DTO
@IsOptional()
@IsString()
aiGeneratedContent?: string;

@IsOptional()
@IsString()
promotionalHeadline?: string;

@IsOptional()
@IsString()
promotionalSummary?: string;

@IsOptional()
@IsString()
keyBenefits?: string;

@IsOptional()
@IsString()
callToAction?: string;

@IsOptional()
@IsString()
socialMediaContent?: string;

@IsOptional()
@IsString()
emailMarketingContent?: string;
```

## Implementation Steps

### Step 1: Frontend Form State Update
1. Open `packages/frontend/src/components/sessions/SessionForm.tsx`
2. Locate the `formData` state initialization around line 64-76
3. Add all AI content fields to the state initialization
4. Ensure these fields are populated from the `session` prop when editing

### Step 2: Auto-save Logic Enhancement
1. In the same file, locate the `performAutoSave` function around line 185-223
2. Find the `submissionData` object creation around line 193-205
3. Add conditional spreading for all AI content fields
4. Test that auto-save preserves existing AI content

### Step 3: Manual Save Logic Enhancement
1. Locate the `handleSubmit` function around line 365-400
2. Find the `submissionData` object creation around line 380-392
3. Add the same AI content preservation logic as auto-save
4. Ensure manual saves also preserve AI content

### Step 4: Backend Service Update
1. Open `packages/backend/src/modules/sessions/sessions.service.ts`
2. Locate the `autoSaveDraft` method around line 177-214
3. Find the update logic around line 189-196
4. Implement proper AI content field preservation logic
5. Test that partial updates don't overwrite existing AI data

### Step 5: DTO Verification
1. Open `packages/backend/src/modules/sessions/dto/update-session.dto.ts`
2. Verify all AI content fields are included with proper validation decorators
3. Add any missing fields if necessary

## Testing Requirements

### Manual Testing Checklist
- [ ] Create a new session and generate AI content
- [ ] Verify AI content displays in SessionContent component
- [ ] Edit the session and confirm AI content loads in form state
- [ ] Make basic edits (title, description) and verify AI content persists after auto-save
- [ ] Make basic edits and manually save, verify AI content persists
- [ ] Test that AI content can still be cleared when intentionally updated
- [ ] Test new AI content generation and integration workflow
- [ ] Verify that refreshing the edit page still shows AI content
- [ ] Test with sessions that have partial AI content (some fields but not all)

### Automated Testing Considerations
- Unit tests for form state management with AI content
- Integration tests for auto-save with AI content preservation
- API tests for partial update behavior with AI fields

## Expected Behavior After Fix

1. **Session Creation**: Users generate AI content, it's saved to the session
2. **Session Editing**: When users return to edit, all AI content is preserved in form state
3. **Auto-save**: Auto-save operations every 3 seconds maintain existing AI content
4. **Manual Save**: Manual form submissions preserve AI content
5. **Content Updates**: Users can still update or clear AI content intentionally
6. **Form Persistence**: AI content remains available throughout the editing session
7. **Page Refresh**: AI content persists even after refreshing the edit page

## Files to Modify

1. `packages/frontend/src/components/sessions/SessionForm.tsx` - Form state and submission logic
2. `packages/backend/src/modules/sessions/sessions.service.ts` - Auto-save preservation logic
3. `packages/backend/src/modules/sessions/dto/update-session.dto.ts` - Verify AI fields exist

## Dependencies

No new dependencies required. This is a bug fix using existing infrastructure.

## Priority

**High** - This is a critical UX issue that significantly impacts the value proposition of the AI features. Users lose significant work when AI content disappears, leading to frustration and reduced adoption.

## Success Criteria

1. AI content persists when editing sessions
2. Auto-save functionality preserves AI content
3. Manual save operations preserve AI content
4. AI content can still be intentionally updated/cleared
5. No regression in existing form functionality
6. Performance impact is minimal (no noticeable slowdown)

## Rollback Plan

If issues arise, revert changes to:
1. SessionForm component state management
2. Auto-save submission logic
3. Backend partial update logic

The changes are isolated and should not affect other system functionality.