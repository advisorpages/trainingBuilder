# Domain Schema – AI Session Builder Overhaul

## Entity Overview

| Entity | Purpose |
| --- | --- |
| Session | Primary aggregate representing a training session draft/published record. Owns metadata, lifecycle state, and relationships to all supporting artifacts. |
| SessionAgendaItem | Ordered agenda entries attached to a session. Captures title, description, duration, and optional AI-generated notes. |
| SessionContentVersion | Versioned AI or manual content blocks (headline, hero copy, CTA, etc.) generated for a session. Tracks author, status, and diff metadata. |
| Topic | Taxonomy record selectable in the builder. Lightweight CRUD with optional tags/descriptions. |
| Incentive | Promotional incentive linked to one or more sessions. Stores eligibility, schedule, and AI-generated messaging. |
| LandingPage | Render-ready landing page artifact for a session (HTML/blocks/settings). Generated in builder but customizable elsewhere. |
| Trainer | Trainer profile with expertise, bio, contact info. |
| TrainerAssignment | Join entity between sessions and trainers (role, confirmed flag, assignment notes). |
| TrainerAsset | Artifacts prepared for trainers (prep kit, coaching tips, attachments) derived from session data. |
| SessionStatusLog | History of lifecycle transitions with actor info, checklist snapshot, and readiness score. |
| User | Authentication principal (Broker, Content Developer, Trainer). |
| Role | Role definitions for RBAC. |

## Relationships

- `Session` 1 — * `SessionAgendaItem` (cascade delete on session removal).
- `Session` 1 — * `SessionContentVersion` (retain history even if not published).
- `Session` many — 1 `Topic` (sessions reference a topic; topic deletion prevented when active sessions exist).
- `Session` ? — ? `Incentive`: Many-to-many via junction `session_incentives` (allows shared incentives). Primary link exposed via builder quick-add.
- `Session` 1 — 1 `LandingPage` (published sessions must have exactly one active landing page revision).
- `Session` * — * `Trainer` through `TrainerAssignment`. Each assignment spawns zero or more `TrainerAsset` records.
- `Session` 1 — * `SessionStatusLog`.
- `SessionContentVersion` optionally references `User` who accepted/edited the content.
- `Topic`, `Incentive`, `Trainer` maintain `createdBy` / `updatedBy` relationships to `User`.

## Session Lifecycle

| Status | Description | Entry Requirements | Exit Conditions |
| --- | --- | --- | --- |
| draft | Newly created session with minimal metadata. | Title, audience, objective. | Manual promotion after checklist satisfied. |
| review | Content developer reviewing AI output. | At least one AI content version generated. | Approval or rework from reviewer. |
| ready | All publish checks met; awaiting final approval. | Readiness score ≥ threshold, landing page preview generated, trainer assigned. | Published or returned to review. |
| published | Session visible on public site and trainer dashboard. | Ready status + publish action. | Retire or revert for revisions. |
| retired | Archived session; visible only internally. | Manual action; cleans up associated schedules. | Reopen to draft (optional).

Readiness score combines: required metadata completion, accepted AI content, landing page sync, trainer assignment, optional incentive linking, QA checklist.

## Key Fields

### Session
- `id` (UUID)
- `title`, `subtitle`, `audience`, `objective`
- `status` (enum)
- `readinessScore` (int 0-100)
- `scheduledAt`, `durationMinutes`
- `topicId`, `primaryIncentiveId` (nullable)
- `landingPageId` (nullable pending publish)
- `aiPromptContext` (jsonb)
- `createdById`, `updatedById`
- `createdAt`, `updatedAt`, `publishedAt`

### SessionAgendaItem
- `id`
- `sessionId`
- `ordinal`
- `title`
- `description`
- `durationMinutes`
- `notes`

### SessionContentVersion
- `id`
- `sessionId`
- `kind` (enum: headline, hero, agendaSummary, incentiveBlurb, trainerIntro, emailCopy, etc.)
- `source` (enum: ai, human)
- `status` (enum: draft, accepted, rejected)
- `content` (jsonb) — supports structured blocks
- `prompt` (text)
- `promptVariables` (jsonb)
- `generatedAt`
- `createdById`
- `acceptedById`
- `acceptedAt`
- `rejectionReason`

### Topic
- `id`
- `name`
- `description`
- `tags` (string array)
- `isActive`
- `createdById`, `updatedById`

### Incentive
- `id`
- `name`
- `overview`
- `terms`
- `startDate`, `endDate`
- `isActive`
- `aiMessaging` (jsonb)
- `createdById`, `updatedById`

### LandingPage
- `id`
- `sessionId`
- `slug`
- `template` (enum)
- `heroImageUrl`
- `content` (jsonb)
- `seoMetadata` (jsonb)
- `publishedAt`
- `lastSyncedAt`

### Trainer
- `id`
- `name`
- `bio`
- `email`
- `phone`
- `expertiseTags` (string array)
- `timezone`
- `isActive`

### TrainerAssignment
- `id`
- `sessionId`
- `trainerId`
- `role` (enum: facilitator, assistant, observer)
- `status` (enum: pending, confirmed, declined)
- `assignedAt`
- `confirmedAt`
- `notes`

### TrainerAsset
- `id`
- `assignmentId`
- `type` (enum: prepKit, coachingTip, attachment)
- `content` (jsonb)
- `source` (enum: ai, manual)
- `createdAt`

### SessionStatusLog
- `id`
- `sessionId`
- `fromStatus`, `toStatus`
- `changedById`
- `remark`
- `readinessScore`
- `checklistSnapshot` (jsonb)
- `createdAt`

## Data Integrity Rules
- Deleting a session cascades to agenda items, content versions, status logs, trainer assignments, trainer assets, and landing page (soft delete optional).
- Topics/incentives require explicit reassign or soft-delete to avoid orphaned sessions.
- Landing pages enforce unique slug per published session.
- Session content versions keep history; only accepted versions feed landing page/trainer assets.
- Trainer assignments must be confirmed before publish readiness is met.

## Open Decisions
- Determine whether multiple landing page templates should be separate entities or configuration on `LandingPage` (current approach: enum).
- Decide on archival strategy (soft deletes vs. hard deletes) for incentives and topics.
- Clarify analytics data model (captured later in Phase 5).

> This schema guides Phase 2 implementation. Update as entities evolve.
