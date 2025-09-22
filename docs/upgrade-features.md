# Feature Upgrade: Enhanced AI Content Persistence and Editing

## Problem Statement

The current implementation for persisting AI-generated content has several limitations. The database schema does not fully accommodate the rich, structured JSON output from the AI, leading to potential data loss. Additionally, the editing experience is not optimal, as there is a disconnect between the raw AI output and the individual promotional fields in the session form. This makes it difficult to view, edit, and save the complete AI content while also having easy access to key promotional fields.

## Root Cause Analysis

1.  **Database Schema:** The `ai_generated_content` field is currently a `text` column, which is not ideal for storing structured JSON data.
2.  **Backend Logic:** The backend services manually handle JSON parsing and stringification, which is unnecessary and error-prone when a proper `jsonb` column is used.
3.  **Frontend State Management:** The form does not provide a way to view and edit the full raw AI JSON, and there is no mechanism to keep the individual promotional fields in sync with the raw JSON when edits are made.

## Solution Requirements

### 1. Database Schema Enhancement
-   In `packages/backend/src/entities/session.entity.ts` (and `incentive.entity.ts` for consistency), change the `ai_generated_content` column type from `text` to `jsonb`.
-   Keep the existing promotional columns (`promotional_headline`, `promotional_summary`, etc.) to allow for easy querying and display of key data.

### 2. Backend Service Refactoring
-   In `packages/backend/src/modules/sessions/sessions.service.ts`, remove all `JSON.parse()` calls on `session.aiGeneratedContent`, as TypeORM will handle this automatically.
-   Similarly, remove all `JSON.stringify()` calls when saving to `session.aiGeneratedContent`. The raw JavaScript object should be passed directly to TypeORM.

### 3. DTO Updates
-   In `packages/backend/src/modules/sessions/dto/create-session.dto.ts` and `update-session.dto.ts`, change the type of `aiGeneratedContent` from `string` to `object` and add the `@IsObject()` class-validator decorator.

### 4. Frontend Form Enhancements (`packages/frontend/src/components/sessions/SessionForm.tsx`)
-   **Add Raw JSON Editor:** In the "Promotional Content" section (visible on the edit page), add a large `textarea` to display the formatted `aiGeneratedContent` JSON.
-   **Implement Two-Way Sync Logic:**
    -   When a user edits an individual promotional field (e.g., `promotionalHeadline`), the corresponding value in the `aiGeneratedContent` JSON object in the form state must be updated automatically.
    -   When a user edits the raw JSON in the new `textarea`, the individual promotional field inputs must be re-populated from the updated JSON. This ensures data consistency.
-   **Update Initial Population:** The `handleAIContentGenerated` function will be responsible for populating both the `aiGeneratedContent` object and the individual promotional fields in the form state from the AI's output.

## Development Plan

1.  **Update Entity Files:** Modify `session.entity.ts` and `incentive.entity.ts` to change the `ai_generated_content` column type to `jsonb`.
2.  **Update DTOs:** Modify `create-session.dto.ts` and `update-session.dto.ts` to change the `aiGeneratedContent` type to `object`.
3.  **Refactor Backend Service:** Edit `sessions.service.ts` to remove all manual `JSON.parse` and `JSON.stringify` operations on the `aiGeneratedContent` field.
4.  **Restart Backend:** Restart the `backend` docker service to apply the changes.
5.  **Enhance Frontend Form:**
    -   Modify `SessionForm.tsx` to add the new `textarea` for raw JSON editing within the "Promotional Content" section.
    -   Implement a new handler function, `handleRawJsonChange`, to manage the two-way data binding between the raw JSON and the individual fields.
    -   Update the existing `handleInputChange` function to also trigger the sync to the raw JSON.
6.  **Restart Frontend:** Restart the `frontend` docker service to load the updated form.
7.  **Verification:** Manually test the complete workflow: generate AI content, save session, edit session, modify individual fields, modify raw JSON, and ensure all changes persist correctly and the form state remains synchronized.

## Progress Update

**Completed Implementation Steps:**

*   **Database Schema Enhancement:**
    *   `packages/backend/src/entities/session.entity.ts`: `ai_generated_content` column type changed from `text` to `jsonb`.
    *   `packages/backend/src/entities/incentive.entity.ts`: `ai_generated_content` column type changed from `text` to `jsonb`.
*   **DTO Updates:**
    *   `packages/backend/src/modules/sessions/dto/create-session.dto.ts`: `aiGeneratedContent` type changed to `object`, `@IsObject()` decorator added.
    *   `packages/backend/src/modules/sessions/dto/update-session.dto.ts`: `aiGeneratedContent` type changed to `object`, `@IsObject()` decorator added.
*   **Backend Service Refactoring (`packages/backend/src/modules/sessions/sessions.service.ts`):**
    *   Removed all `JSON.parse()` and `JSON.stringify()` calls on `aiGeneratedContent` in `saveGeneratedContent`, `getGeneratedContent`, `getContentVersions`, `restoreContentVersion`, `integrateAIContentToDraft`, and `previewSessionWithAIContent` methods.
*   **Frontend Form Enhancements (`packages/frontend/src/components/sessions/SessionForm.tsx`):**
    *   Trainer dropdown added to the 'Resources' section.
    *   New 'Promotional Content' section added (visible on edit page only) with individual input fields for `promotionalHeadline`, `promotionalSummary`, `keyBenefits`, `callToAction`, `socialMediaContent`, and `emailMarketingContent`.
    *   'Raw AI-Generated Content (JSON)' textarea added to the 'Promotional Content' section.
    *   `handleAIContentGenerated` function updated to correctly map all AI fields from the generated content to the form's state.
    *   `handleRawJsonChange` and `handleInputChange` functions implemented to ensure two-way data synchronization between individual promotional fields and the raw JSON content.
*   **AI Content Section Enhancement (`packages/frontend/src/components/sessions/AIContentSection.tsx`):**
    *   `useEffect` hook added to re-populate the 'Generated Content' section from `sessionData.aiGeneratedContent` when the component mounts.
    *   `handleContentChange` function updated to propagate edits made within the AI content section back to the parent `SessionForm`.
*   **Test User Creation Script:**
    *   `tests/e2e/create-test-users.ts` script created to add specific test users (`sarah.content@company.com`, `john.trainer@company.com`, `broker1@company.com`) with the password `Password123!`.
    *   Import path in `create-test-users.ts` fixed to `../../packages/backend/src/entities/index`.

## Expected Behavior After Fix

1.  **Complete Data Persistence:** The full, raw JSON output from the AI is saved to the database in a `jsonb` column, ensuring no data is lost.
2.  **Dual Editing Capability:** Users can edit the main promotional content through simple input fields OR by directly editing the raw JSON in a textarea.
3.  **Data Synchronization:** Changes made in one editing view (e.g., individual fields) are automatically reflected in the other (raw JSON), and vice-versa.
4.  **Robust Storage:** The use of `jsonb` provides a more efficient and queryable storage mechanism for the AI content in the database.
