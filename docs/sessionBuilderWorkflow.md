# Session Builder Workflow

This guide documents the end-to-end lifecycle of a training session inside the Session Builder, combining the user-facing journey with the underlying technical flow from draft creation to publication.

---

## High-Level Stages

| Stage | User Perspective | Technical Perspective |
| --- | --- | --- |
| 1. Load Builder | User opens Session Builder from dashboard or deep link. | `SessionBuilderProvider` boots, fetches existing draft via `sessionBuilderService.getDraft`, hydrates context state, sets autosave timers. |
| 2. Configure Session | User completes “Session Setup” metadata form and optionally uses test data buttons. | Form updates `SessionMetadata` in context. `builderReducer` tracks dirty state, validation errors. Autosave payloads persist metadata to backend via `saveDraft`. |
| 3. Generate Variants | User requests “Generate Variants”, previews options, and selects one. | Frontend verifies required fields, calls `sessionsService.generateMultipleOutlines`. Backend runs RAG query, builds prompt inputs, and returns up to four variant outlines. Selection logs analytics and stores accepted outline in draft. |
| 4. Review & Edit | User edits outline sections, duplicates/moves content, adjusts metadata. | Edits propagate to reducer state. Autosave keeps `SessionDraftData` in sync (outline, metadata, readiness score). AI Composer stores accepted version ID. |
| 5. Finalize & Publish | User hits “Publish Session”. | Builder validates readiness, calls `sessionsService.publishSession` to persist final outline, create content version, update analytics, and transition draft to published session. |

---

## Detailed Flow

### 1. Builder Initialization

**User actions**
- Navigate to Session Builder page (`/session-builder` or via KPI links).
- Wait for loading spinner until workspace loads.

**System events**
1. `SessionBuilderPage` creates `SessionBuilderProvider` with `sessionId`.
2. Provider dispatches `INIT_START`, loads draft from `/session-builder/drafts/:id`.
3. Response normalizes into `SessionDraftData`: metadata, outline, prompt, AI versions, readiness score, timestamps.
4. Context sets autosave timers and exposes hooks (e.g., `updateMetadata`, `generateMultipleVariants`, `selectVariant`).

### 2. Session Configuration (Setup Step)

**User actions**
- Fill required metadata: category, session type, desired outcome, location, etc.
- Optionally hit “Fill Test Data” buttons (development only).
- Toggle tone, audience, and location selectors.
- Add up to three custom topics.

**System events**
1. Form inputs call `updateMetadata`, merging partial updates into `draft.metadata`.
2. Validation runs on blur; errors stored locally and surfaced inline.
3. Autosave timer (default ~10 s of inactivity) calls `sessionBuilderService.autosaveDraft`.
4. Autosave payload persists metadata, outline, selected AI version, and readiness score. Autosave indicator shows pending/success/error and supports manual save/undo.

### 3. Generate & Select Variants (Generate Step)

**User actions**
- Click “Generate Variants”.
- Watch loading animation while variants are prepared.
- Compare variant cards, expand RAG sources, review contribution mix, then choose “Select & Edit”.
- Optionally click “Regenerate” for new variants.

**System events**
1. Frontend verifies mandatory metadata; if missing, shows toast warning.
2. `generateMultipleVariants` sets status `pending` and calls backend `SessionsService.suggestMultipleOutlines`.
3. Backend pipeline:
   - Run RAG query (via `ragService.queryRAGWithRetry`) using metadata, topics, audience, tone.
   - Determine `ragWeight` (0, 0.35, or 0.7 depending on heuristics and quick tweaks).
   - For each variant persona (Precision, Insight, Ignite, Connect):
     - Pull label/description/instruction from `variant_configs` table.
     - Substitute instruction placeholders (metadata, topics, audience, rag stats).
     - Build `OpenAISessionOutlineRequest` with shared RAG results and persona directives.
     - Call OpenAI to produce structured sections; adjust durations, ensure required sections, and attach matching topics.
   - Return `MultiVariantResponse` (variants array + metadata).
4. Frontend stores variants, logs analytics, displays cards with outlines, RAG source badges, and AI/RAG/User contribution mix.
5. When the user selects a variant:
   - Convert outline to `AIContentVersion`.
   - Dispatch `AI_REQUEST_SUCCESS` and `ACCEPT_AI_VERSION`, persisting accepted version ID.
   - Save variant selection via `sessionBuilderService.logVariantSelection`.
   - Update draft outline in state.

### 4. Review & Edit (Review Step)

**User actions**
- Inspect outline inside “Session Preview”.
- Edit sections: modify title/description/duration, reorder, duplicate, or delete.
- Add new sections via Quick Add modal.
- Adjust metadata if needed, optionally regenerate new versions for comparison.
- Use Version Comparison modal when multiple AI versions exist.

**System events**
1. Edits dispatch reducer actions (`UPDATE_OUTLINE_SECTION`, `MOVE_SECTION`, `DUPLICATE_SECTION`, etc.).
2. Each edit marks draft dirty and triggers autosave cycle.
3. AI Composer remains synchronized with selected/accepted version; accepting new version updates outline and file list.
4. Readiness indicator recalculates status (metadata completeness, outline present, accepted version).

### 5. Finalize & Publish (Finalize Step)

**User actions**
- Review checklist confirming outline readiness.
- Click “Publish Session”.
- Observe success toast and optional redirect to published session.

**System events**
1. Frontend validates prerequisites (all tasks complete, readiness threshold met).
2. Call `sessionBuilderService.publishSession`, which:
   - Validates draft integrity.
   - Creates or updates `Session` entity with metadata and finalized outline.
   - Generates `SessionContentVersion` linked to accepted AI version.
   - Records readiness score, analytics events, and AI interaction log.
   - Clears draft or marks status as published.
3. Provider updates context (`publishStatus`, `publishedSessionId`) and surfaces success UI.

---

## Supporting Mechanics

### Autosave & Draft Management
- Autosave state: `idle`, `pending`, `success`, `error`. Manual save button uses same pipeline.
- Undo autosave reverts to last persisted snapshot if available.
- Draft response includes `lastAutosaveAt` timestamp for status indicator.

### AI Composer & Versioning
- `draft.aiVersions` stores historical generations as `AIContentVersion`.
- Accepting a version sets `acceptedVersionId`, while selecting toggles active view.
- Version comparison modal allows side-by-side diff of sections and summaries.

### Analytics & Logging
- Google Analytics events emitted for generation, selection, failures.
- Backend logs variant selections to `ai_interactions` with metadata (variant label, rag weight, category).
- Errors surface toast notifications via `useToast`.

### Error Handling
- Generation failures revert to legacy single-outline workflow.
- Autosave errors display inline status and allow manual retry.
- Publishing issues return meaningful message and keep draft in review state.

---

## Data Model Snapshot

```ts
interface SessionMetadata {
  title: string;
  sessionType: 'event' | 'training' | 'workshop' | 'webinar';
  category: string;
  desiredOutcome: string;
  currentProblem: string;
  specificTopics: string;
  startDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location: string;
  locationId?: number;
  audienceId?: number;
  audienceName?: string;
  toneId?: number;
  toneName?: string;
  topics?: Array<{ title: string; description?: string; durationMinutes: number }>;
}
```

```ts
interface SessionDraftData {
  sessionId: string;
  metadata: SessionMetadata;
  outline: SessionOutline | null;
  aiPrompt: string;
  aiVersions: AIContentVersion[];
  acceptedVersionId?: string;
  selectedVersionId?: string;
  readinessScore: number;
  lastAutosaveAt?: string;
  isDirty: boolean;
}
```

---

## Publishing Output

Publishing produces:
- `sessions` record (metadata, scheduling, audience).
- `session_content_versions` entry referencing final outline sections.
- AI interaction logs capturing accepted variant.
- Analytics events for publish success.

Draft state remains available for future edits until explicitly archived or replaced.

---

## Summary

The Session Builder aligns a guided user experience with a multi-step technical pipeline:
1. Collect structured metadata.
2. Run RAG-assisted variant generation.
3. Let users vet, edit, and personalize outlines.
4. Persist drafts continuously with autosave.
5. Publish once ready, lifting the draft into production records.

Understanding both perspectives helps diagnose issues, extend features (e.g., new placeholders), and keep the UX tightly coupled to backend guarantees. Refer to this workflow whenever modifying builder steps, autosave cadence, or publishing logic.*** End Patch
