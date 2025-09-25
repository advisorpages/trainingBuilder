# AI Session Builder Overhaul (High-Level Overview)

## Objective
Rebuild the Leadership Training App so every capability revolves around the AI Session Builder at `/sessions/builder`. Simplify the codebase, enforce a clean domain model anchored on sessions, and ensure all supporting modules (topics, incentives, landing pages, trainer tools) flow naturally from that centerpiece.

## Strategy Pillars
- **Builder-Centric Domain**: Model sessions as the primary aggregate with connected satellites (topics, incentives, landing pages, trainer assets, AI content versions).
- **Backend Reinitialization**: Reset NestJS modules around clear feature slices, integrate an AI abstraction layer, and implement lifecycle controls for session publishing.
- **Frontend Rebuild**: Create a worksheet-style builder experience with state machines, live preview, inline AI workflows, and lightweight CRUD embedded for quick edits.
- **Supporting Surfaces**: Rebuild dashboards, admin tables, public pages, and trainer tools to consume the new APIs while deferring core edits to the builder.
- **Operational Guardrails**: Archive legacy assets, document new architecture, and reinforce testing/CI to keep the refactor stable.

## Phase Summary
1. **Foundation Reset** – Audit, archive, and document the reduced scope; prepare the repo for a clean rebuild.
2. **Domain & Backend Core** – Redesign schema, rebuild backend feature slices, and expose APIs that reflect the new session-centric model.
3. **Frontend Builder Core** – Implement the session builder shell, autosave and AI flows, and shared UI primitives.
4. **Supporting Modules Integration** – Reconnect topics, incentives, landing pages, trainer dashboard, and public pages on top of the new infrastructure.
5. **AI Experience & Quality Gates** – Polish AI interactions, enforce publish readiness, and harden the system with end-to-end validation.

Each phase ships a self-contained milestone with a documented test plan so subsequent work can start with confidence.
