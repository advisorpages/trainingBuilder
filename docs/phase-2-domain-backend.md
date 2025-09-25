# Phase 2 – Domain & Backend Core

## Goal
Rebuild the backend around a session-centric domain with clean feature slices, fresh migrations, and AI abstraction hooks.

## Inputs
- Phase 1 deliverables (clean repo, updated docs)
- Proposed data model from blueprint
- Existing NestJS infrastructure

## Core Tasks
1. **Finalize Domain Model**
   - Define entities: `Session`, `SessionAgendaItem`, `SessionContentVersion`, `Topic`, `Incentive`, `LandingPage`, `Trainer`, `TrainerAssignment`, `TrainerAsset`, `SessionStatusLog`.
   - Document relationships and invariants in `docs/domain-schema.md`.
2. **Reset Database Schema**
   - Drop legacy migrations.
   - Implement new migrations using Prisma or TypeORM (consistent with repo).
   - Create seed scripts for topics, sample incentives, trainers, and demo sessions.
3. **Module Restructure**
   - Create Nest modules: `sessions`, `topics`, `incentives`, `landing-pages`, `trainers`, `auth`, `ai`.
   - Move shared logic into `backend/src/common` (DTO validation, guards, interceptors).
4. **Session Lifecycle Engine**
   - Implement status transitions (`draft`, `review`, `ready`, `published`, `retired`).
   - Enforce validation rules (required fields, AI content acceptance, landing page generated, trainer assigned).
   - Emit status logs for auditing.
5. **AI Abstraction Layer**
   - Create `AiContentService` with prompt builders, provider adapters, retry/backoff, and content moderation hooks.
   - Stub external calls for now (real provider integration comes later).
6. **API Surface**
   - CRUD endpoints for sessions and satellites.
   - Autosave endpoint for builder drafts.
   - AI generate/regenerate endpoints returning structured content blocks.
   - Publish/unpublish pipeline endpoints.
7. **Testing & Tooling**
   - Unit tests for domain services.
   - Integration tests (supertest) for session lifecycle endpoints.
   - Seed data verification script.

## Deliverables
- Updated backend modules implementing the new domain.
- Database migrations and seed scripts.
- AI service abstraction ready for later feature work.
- Documented API contract (`docs/api-sessions.md`).

## Test Plan
1. **Automated Tests**
   - `npm run test --workspace=packages/backend` (unit + integration) must pass.
   - Validate migration sequence by running `npm run db:migrate && npm run db:seed` (create scripts if missing).
2. **Manual API Smoke**
   - Use `npm run dev:test` or Postman to exercise: create session draft, attach topic/incentive, request AI content (stub), publish session.
   - Confirm status logs update correctly via API responses or DB.
3. **Data Integrity**
   - Inspect database (psql) to ensure constraints/relations behave as expected (e.g., deleting a session cascades to satellites only when intended).
4. **Documentation Sync**
   - Check that `docs/domain-schema.md` matches actual entity definitions.

## Status Notes (2025-09-24)
- Domain schema (`docs/domain-schema.md`) and initial migration (`packages/backend/src/migrations/1700000000000-CreateSessionBuilderSchema.ts`) created.
- Backend feature slices rebuilt (`sessions`, `topics`, `incentives`, `landing-pages`, `trainers`, `ai`, `users`, `email`) with placeholder CRUD endpoints.
- `npm run build --workspace=packages/backend` passes; Jest suite still failing because Postgres-specific column types (`timestamptz`, `jsonb`) are incompatible with the legacy sqlite-based tests and old integration specs expect the previous architecture (tracked in `docs/phase-issues.md`).
- Backend unit tests now attempt to run against a Postgres Testcontainers harness (`sessions.service.spec.ts`). When Docker isn't available the suite logs a warning and exits early, so local developers should enable Docker to exercise the real flow.

## Handoff Checklist
- [ ] Backend tests green.
- [ ] Migration/seed scripts executed successfully on a fresh DB.
- [ ] API contract docs updated and linked from README.
- [ ] AI service stub documented for frontend consumption.
