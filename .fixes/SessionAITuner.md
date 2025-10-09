# Session AI Tuner Enhancement Plan

## Overview
Create a single "Session AI Tuner" workspace that lets product/ops users review past generations, compare outputs, tweak prompts, and rerun experiments without touching code. Focus on clarity, approachable language, and minimal navigation friction.

## Page Structure
Tabs along the top (accessible via keyboard & screen reader labels):
1. **Overview** – headline metrics (success rate, RAG hit rate, avg duration variance) plus quick issues list.
2. **Recent Generations** – main run gallery, comparison tools.
3. **Prompt Sandbox** – prompt editing, overrides, quick tweaks.
4. **Saved Settings** – pinned benchmarks & configuration bundles.

Keep core navigation persistent; sub-tabs only inside Prompt Sandbox to avoid deep nesting.

## Data Sources & API Work
- Extend `AIInteractionsService` with a comparison-friendly endpoint: `GET /ai-interactions/comparisons` returning prompt, structured output, rag metadata, config snapshot, overrides, and user notes.
- Capture configuration snapshots for each generation (variant label, duration target, rag mode, active overrides). Store in `ai_interactions.metadata.activeOverrides` or a dedicated table.
- Add optional `ai_interaction_snapshots` view for fast read access (flattened documents used by the UI).
- Create endpoints for override management: `GET/PUT /ai-prompts/current`, `POST /ai-prompts/override`, `DELETE /ai-prompts/override/:id`.
- Ensure session builder reads override state before calling OpenAI/RAG.

## UI Details
### Overview Tab
- Cards: "Success Rate", "RAG Usage", "Avg Duration Delta", "Recent Issues" (show last 3 failures with direct links).
- Secondary section: "Active Settings" showing whether overrides are in use (e.g., “Precision persona adjustments: ON”).
- Add onboarding blurb (“Review recent generations, then adjust prompts in the sandbox tab”) to guide intermediate users.

### Recent Generations Tab
- Run list (chronological): each card shows timestamp, variant label, status, rag badge (AI-only vs KB + AI), duration sum vs target, config summary, quick ratings (if any notes).
- Buttons on each card: `Compare`, `Open in Sandbox`, `Pin as Benchmark`.
- `Compare` opens a side drawer with two panes; choose comparison target via dropdown (recent runs + pinned benchmarks). Tabs inside drawer: `Summary`, `Prompt Details`, `Outline JSON`. Default to `Summary` for quick insights.
- Add a "What worked?" note field per run; store in interactions metadata.

### Prompt Sandbox Tab
- Sub-tabs: `Variant Personas`, `Global Tone & System`, `Duration & Flow`. Each contains cards with editable textareas (live char count, Markdown support optional).
- `Quick Tweaks` panel on the right with toggles/sliders (e.g., “Increase Data Emphasis”, “Speed Up Pace”, “Raise RAG priority”). Each toggle maps to known overrides.
- Actions: `Apply to Next Run`, `Save as Template`, `Revert to Default`. Show diff snippet vs baseline.
- Live preview area illustrating how the full prompt composes after edits.
- Provide cross-tab deep links so `Open in Sandbox` auto-focuses the relevant card and scrolls it into view.

### Saved Settings Tab
- Grid of pinned benchmarks: display label, created by, last used, notes. Buttons: `Load into Sandbox`, `Set as Default`, `Delete`.
- Option to export/import setting bundles as JSON for sharing.

## UX Copy Guidelines
- Use verb-first labels: `Compare`, `Run Test`, `Save Settings`, `Apply Override`.
- Provide helper text: e.g., “RAG Mode: Off (No knowledge-base sources were used)” or “Duration Target: 90 minutes (Variance: +10).”
- Inline explainers near toggles (tooltip or secondary text) for intermediate users.
- Keep technical blocks (full prompts, raw JSON) collapsed by default with “Show Details” toggles.

## Workflow Notes
1. User lands on Overview to gauge overall health.
2. Navigate to Recent Generations; review run cards.
3. Hit `Compare` to open side-by-side view against a benchmark.
4. Click `Open in Sandbox` to auto-load the run’s settings into the Prompt Sandbox.
5. Adjust prompts/toggles, save overrides, optionally run a test generation.
6. Pin successful results to Saved Settings for future comparison.

## Implementation Checklist
- [ ] Backend: add comparison endpoint + override CRUD.
- [ ] Backend: persist per-run config snapshot & user notes.
- [ ] Frontend: build tabs, run list, comparison drawer, sandbox editors, quick tweaks panel, saved settings grid.
- [ ] Integrate sandbox overrides with existing generation flow.
- [ ] Add metrics summary components to Overview tab.
- [ ] Add analytics events when overrides applied, runs compared, or settings pinned.
- [ ] Document workflow for internal ops.

## Phase 2 – Unified Page UX Enhancements
Goal: deliver the entire workflow on a single “Session AI Tuner” page while keeping navigation approachable.

- Route legacy AI admin menu links into the tuner and retire redundant pages after migration.
- Maintain the four-tab layout with a persistent header and breadcrumb (“Admin > Session AI Tuner”) to reinforce context.
- Ensure cross-tab actions (e.g., `Open in Sandbox`) auto-switch tabs and highlight the targeted card.
- Default technical details to collapsed states; keep summaries and helper text in plain language.
- Add lightweight onboarding copy plus contextual tooltips to support intermediate users.
- Verify keyboard/ARIA support across tabs, drawers, toggles to keep the unified page accessible.
- Track usage analytics (tab switches, comparisons, sandbox saves) to validate the single-page UX.
