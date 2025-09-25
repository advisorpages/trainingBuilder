# Leadership Training App – PRD v2 (Builder-Centric)

## 1. Vision & Goals
- Make the AI Session Builder the primary workflow for creating and publishing training sessions.
- Reduce friction by letting users generate 80% of session content, incentives, and landing pages inside the builder.
- Support trainers and public audiences with assets generated from the builder without redundant data entry.

## 2. Core Personas & Needs
| Persona | Objectives |
| --- | --- |
| Content Developer | Quickly craft sessions, iterate on AI copy, manage incentives, publish landing pages. |
| Trainer | Receive clear assignments, prep materials, and coaching tips derived from the builder output. |
| Prospective Attendee | Consume public landing pages that communicate value and offer easy registration. |

## 3. Functional Scope (MVP)
1. **AI Session Builder**
   - Worksheet UX combining metadata, AI prompt editing, generated content slots, and readiness scoring.
   - Quick-add modals for topics, incentives, trainers with links to advanced CRUD pages.
   - Live landing page preview driven by session data.
2. **Supporting Modules**
   - Topics & Incentives admin tables (outside builder for detailed CRUD).
   - Landing page customization view for marketing tweaks.
   - Trainer dashboard listing upcoming assignments and associated assets.
   - Public session pages + QR codes tied to published sessions.
3. **Content Lifecycle**
   - Session statuses: draft → review → ready → published → retired.
   - Publishing checklist requiring accepted AI copy, landing page preview, trainer assignment, and (optional) incentive.

## 4. Non-Functional Requirements
- Builder interactions should respond within 300ms for form updates and 1s for AI actions (excluding external provider latency).
- Support responsive layouts with accessible controls (WCAG 2.1 AA target).
- Maintain audit history of AI generations and manual overrides.
- Provide seed data for demos and automated tests.

## 5. Technical Foundations
- **Backend**: NestJS modules (`sessions`, `topics`, `incentives`, `landing-pages`, `trainers`, `auth`, `ai`). PostgreSQL schema anchored on the `Session` aggregate with satellite tables.
- **Frontend**: React (Vite) feature modules, state machine for builder flow, React Query for data fetching.
- **AI Integration**: Abstraction layer supporting prompt templates, provider adapters, retry policies, and moderation.

## 6. Release Phases
- Phase 1: Foundation reset (archive & documentation)
- Phase 2: Domain and backend core (schema + APIs)
- Phase 3: Frontend builder core (worksheet UX)
- Phase 4: Supporting modules integration (admin/public/trainer surfaces)
- Phase 5: AI polish, readiness gates, analytics

## 7. Success Metrics
- Builder completion time < 5 minutes for experienced user (target).
- 90% of published sessions created through the builder without manual backend edits.
- Trainer dashboard adoption: 100% of published sessions generate trainer kit assets automatically.
- Zero critical accessibility violations in builder/public pages at launch.

## 8. Open Questions
- Do we need localization/multi-language support in MVP?
- Should incentives require approval workflow before publishing?
- What analytics platform will store builder telemetry events?

> Refer to `docs/phase-*.md` for task-level execution details per phase.
