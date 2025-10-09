# Topic Metadata Enhancements Plan

## Goal
Let builders optionally capture structured topic entries (title, description, duration in minutes) on the Session Builder setup step, feed that context into AI generation, and carry it through review and analytics—without adding heavy complexity.

## Milestones
1. **Model & Persistence Updates**
   - Extend `SessionMetadata` and related TypeScript types to support `topics[]`.
   - Seed empty topics array in builder defaults and ensure autosave payloads persist it.
   - Update backend DTOs (`SuggestOutlineDto`, OpenAI request interface) plus sanitizers/serializers to accept the new optional field.

2. **UI Enhancements**
   - Add a minimal repeater to `SessionMetadataForm` for topic rows (title, optional description, duration minutes).
   - Enforce lightweight validation (required title, non-negative duration, auto-round to nearest 5 minutes).
   - Display cumulative requested topic minutes alongside session duration for quick conflict awareness.

3. **AI Prompt & Variant Flow**
   - Append the requested topics to the builder prompt (`buildPrompt` front-end) and the backend OpenAI prompt (`buildPrompt` in `openai.service`).
   - When variants return, reconcile sections so user-requested topics appear with enriched copy but retain titles/durations.
   - Surface a “Topics You Requested” summary in the review sidebar for confirmation.

4. **Downstream Usage**
   - Ensure topics propagate to the Topics table integration (reuse existing association logic, now seeded with user-provided titles).
   - Capture simple analytics (e.g., count of provided topics) for insight into feature adoption.

5. **Testing & QA**
   - Update existing front-end tests (`SessionBuilderProvider`, reducer) with the new metadata shape.
   - Add a smoke test that seeds two topics and asserts the prompt includes them before variant generation.
   - Refresh backend specs covering outline suggestions to include optional topics input.

## Open Questions / Follow-Ups
- Do we need guardrails when summed topic durations exceed scheduled minutes (warn vs. auto-adjust)?
- Should we persist user-entered topic IDs if they map to existing catalog entries, or always treat them as free-form?

