# Phase Issues Log

Use this file to capture open questions or blockers discovered during each phase.

| Date | Phase | Issue | Owner | Status |
| --- | --- | --- | --- | --- |
| 2025-09-24 | Phase 1 | `npm run lint` fails due to legacy backend/frontend files still in tree; lint config references tests outside tsconfig scope and many unused vars remain. Recommended: defer fixes to Phase 2 when those modules are rebuilt, or temporarily adjust lint target to exclude legacy directories until rewritten. | Open | Pending |
| 2025-09-24 | Phase 2 | `npm run test --workspace=packages/backend` fails because legacy integration suites still expect the old schema and the new entities use Postgres-specific column types (`timestamptz`, `jsonb`). Action: rebuild backend test harness after stabilizing the new module APIs or provide Postgres-backed test utilities. | Open | Pending |
| 2025-09-24 | Phase 3 | Frontend autosave falls back to local storage when `/sessions/builder/:id/autosave` is unavailable; backend stub must be implemented and return `{ savedAt }` payload once ready. | Backend | Resolved 2025-09-26 – endpoint now persists drafts and returns `savedAt`. |
