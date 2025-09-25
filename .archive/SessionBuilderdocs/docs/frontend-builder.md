# Frontend Builder Architecture

## Overview
Phase 3 delivers the new AI Session Builder focused on a worksheet-style experience that keeps session metadata, AI collaboration, and preview scaffolding in one workspace. The feature lives under `/sessions/builder/:sessionId` and now supports side navigation for session-first flows, responsive dual-pane layout, autosave with undo, and AI versioning.

## Core Architecture
- **Routing Shell** – `App.tsx` defines `/sessions/builder/:sessionId` (with `/sessions/builder` redirect), and adds friendly aliases for `/sessions`, `/incentives`, and `/topics`. `BuilderLayout` provides the persistent sidebar and header slot used across builder-first flows.
- **State Container** – `SessionBuilderProvider` (React context + reducer) keeps session metadata, outline draft, AI prompt, version history, readiness score, and autosave status. It exposes imperative helpers (`generateAIContent`, `manualAutosave`, `acceptVersion`, etc.) consumed by feature components.
- **UI Toolkit** – A lightweight component kit under `packages/frontend/src/ui` (buttons, inputs, cards, tabs, progress, toast) standardises styling for builder and future modules.

## Builder State Machine
Reducer actions orchestrate the main lifecycle:
- `INIT_*` handle hydration from backend/local storage with fallback defaults.
- `UPDATE_METADATA | UPDATE_OUTLINE | UPDATE_PROMPT` mark the draft dirty and queue autosave.
- `AI_REQUEST_*` manages generate/regenerate flows, inserting versions into history and tracking the selected version.
- `ACCEPT_AI_VERSION | CLEAR_ACCEPTED_VERSION` lock accepted content which boosts readiness.
- `AUTOSAVE_*` reflect debounce-triggered saves and support undo by restoring the last snapshot.
- `RESTORE_DRAFT` reverts to the last persisted state when users undo.
Autosave tries the backend endpoint first, then falls back to local storage while still surfacing offline messaging.

## UI Composition
Inside `SessionBuilderPage` the workspace splits into two columns:
- **SessionMetadataForm** – Key fields, debounced autosave hook, and quick AI trigger.
- **AIComposer** – Prompt editor, generate/regenerate buttons, version timeline, and accept/reject actions.
- **ArtifactsPreview** – Readiness indicator, tabs for landing page scaffold, outline view, and trainer kit placeholder. A quick-add modal wires into `sessionBuilderService.createDefaultSection` to append sections rapidly.

## Autosave & Versioning
- Edits mark the draft dirty; a 1.5s debounce triggers `autosaveDraft`. Success toasts include undo, while failures surface retry actions.
- Manual save button in the header calls `manualAutosave` for explicit control.
- AI versions persist per generation and can be reselected without overwriting history. Acceptance updates readiness and powers the live preview.

## Accessibility & Responsiveness

### Keyboard Navigation
The session builder implements comprehensive keyboard navigation support:

- **Tab Order**: All interactive elements follow logical tab order: form inputs → action buttons → navigation → modal controls
- **Focus Management**: Focus is properly trapped within modals (QuickAddModal) and restored when modals close
- **Keyboard Shortcuts**:
  - `Escape` closes open modals and dialogs
  - All buttons are keyboard accessible with standard `Enter`/`Space` activation
- **ARIA Labels**: Interactive controls include proper `aria-label` attributes:
  - Modal close buttons: `aria-label="Close quick add"`
  - Form inputs have associated labels using `<label>` elements or `aria-labelledby`
  - Status indicators have descriptive text for screen readers

### Responsive Design
The builder adapts to different screen sizes using CSS Grid and responsive utilities:

- **Desktop (≥1280px)**: Dual-pane layout with metadata form on left, preview on right
- **Tablet (768px-1279px)**: Dual-pane layout with adjusted proportions
- **Mobile (≤767px)**:
  - Single column stacked layout
  - Form sections stack vertically for better readability
  - Sidebar collapses into hamburger menu (if applicable)
  - Touch-friendly button sizes (minimum 44px touch target)

### Visual Accessibility
- **Color Contrast**: All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- **Status Indicators**: Multiple signal types for autosave status:
  - Color coding: green (success), blue (pending), red (error), gray (idle)
  - Text labels: "Saved", "Saving…", "Save failed", "Saved locally"
  - Icons supplement color for colorblind users
- **Focus States**: Clear focus rings on all interactive elements using `focus:ring-2 focus:ring-blue-500`

### Error Handling & Feedback
- **Toast Notifications**: Non-intrusive messages for autosave status with option to undo
- **Form Validation**: Inline error messages appear below inputs with clear, descriptive text
- **Loading States**: Visual feedback during AI content generation and autosave operations
- **Offline Support**: Graceful degradation with local storage fallback and appropriate messaging

### Screen Reader Support
- **Semantic HTML**: Proper use of headings (`h1`, `h2`, `h3`) for document outline
- **Form Labels**: All form inputs have associated labels for screen reader announcements
- **Live Regions**: Autosave status updates use `aria-live` regions for real-time announcements
- **Alternative Text**: Icons and visual elements include descriptive text alternatives

### Testing Coverage
- **Automated Tests**: Component tests verify keyboard navigation and ARIA attributes
- **Manual QA Checklist**: Regular testing with keyboard-only navigation and screen readers
- **Responsive Testing**: Playwright tests include viewport size changes to verify responsive behavior

## Testing & Validation
- Reducer unit tests (`state/__tests__/builderReducer.test.ts`) cover AI lifecycle, autosave transitions, and draft restoration.
- Run `npm run test --workspace=packages/frontend` to execute vitest suite. Lint and typecheck remain available via existing workspace scripts.

## Next Steps
Phase 4 can: wire outline edits to richer section editors, hydrate trainer kit tab, and extend toast provider globally if other modules need shared messaging.

## Working With Drafts Locally
- The browser stores a mirrored draft under `sessionBuilder_draft_{sessionId}`. Clear it via DevTools > Application > Local Storage when you need a clean slate.
- To stage demo data quickly, paste a JSON payload matching the autosave contract into that local storage key and refresh—`SessionBuilderProvider` will hydrate it on load.
- Server-side autosave now wins once the backend is reachable; if you need to test offline behaviour, simulate by blocking the autosave request and watch the toast fall back to local storage messaging.
