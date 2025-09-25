# Phase 1 Inventory & Classification

## Backend Modules (`packages/backend/src/modules`)

| Module | Classification | Notes |
| --- | --- | --- |
| admin | Archive | Legacy utilities; replaced by builder-centric admin pages later. |
| ai | Rework | Forms the base for the new AI abstraction layer. |
| attributes | Archive | Superseded by streamlined session satellites. |
| audiences | Archive | Consolidated into session metadata for MVP. |
| auth | Keep | Required for role-based access. |
| categories | Archive | Folded into topics taxonomy. |
| dev | Archive | Developer tooling moved to docs/scripts. |
| email | Rework | Needed for trainer notifications; will be redesigned. |
| health | Keep | Basic health checks remain. |
| incentives | Rework | Supports builder-linked incentive workflows. |
| locations | Archive | Location data will be embedded in session metadata for now. |
| sessions | Rework | Core aggregate handled in upcoming phases. |
| settings | Archive | Config will be simplified; move details to new module later. |
| tones | Archive | Tone selection folded into AI prompt presets. |
| topics | Rework | Needed for builder topic selection. |
| trainer-dashboard | Archive | To be rebuilt under new trainer module. |
| trainers | Rework | Maintained for assignments and assets. |
| users | Keep | Core authentication users. |

## Frontend Pages (`packages/frontend/src/pages`)

| Page | Classification | Notes |
| --- | --- | --- |
| Analytics.tsx / AnalyticsPage.tsx | Archive | New analytics planned in later phase. |
| BrokerIncentivesPage.tsx | Archive | Redundant with new incentives admin. |
| BrokerReportsPage.tsx | Archive | Outside MVP scope. |
| BrokerSessionsPage.tsx | Archive | Sessions listing will be rebuilt. |
| DashboardPage.tsx | Archive | Obsolete home; builder becomes primary. |
| HomePage.tsx | Archive | Replaced by new dashboard shell. |
| IncentiveWorksheetPage.tsx | Archive | Superseded by builder + admin CRUD. |
| LoginPage.tsx | Keep | Entry point for auth. |
| ManageAudiencesPage.tsx | Archive | Audiences removed. |
| ManageCategoriesPage.tsx | Archive | Categories folded into topics. |
| ManageLocationsPage.tsx | Archive | Locations inline with sessions. |
| ManageSessionsPage.tsx | Archive | Rebuilt listing in Phase 4. |
| ManageSettingsPage.tsx | Archive | Settings restructure later. |
| ManageTonesPage.tsx | Archive | Tones folded into prompts. |
| ManageTopicsPage.tsx | Rework | Light topic admin kept. |
| ManageTrainersPage.tsx | Rework | Trainer admin retained. |
| PublicHomepage*.tsx/css | Rework | Public pages redesigned later. |
| QrCodeManagementPage.tsx | Archive | Workflow integrated into publish pipeline. |
| SessionBuilderPage.tsx | Rework | Central builder to be rebuilt. |
| SessionDetailPage.tsx/css | Rework | Public session view maintained. |
| SessionWorksheetPage.tsx | Archive | Legacy builder replaced. |
| TrainerDashboardPage.tsx | Archive | Rebuilt under new trainer module. |
| TrainerSessionDetailPage.tsx | Archive | Rebuilt later.

## Frontend Components (Selected)

| Directory | Classification | Notes |
| --- | --- | --- |
| audiences / auth / categories / incentives / locations / settings / tones | Archive | Tied to deprecated modules. |
| common / ui | Keep | Base primitives reusable. |
| features | Rework | Evaluate per sub-feature. |
| session-builder | Rework | Will be replaced with new builder components. |
| sessions / trainers / topics | Rework | Align to new APIs. |
| RegistrationForm* | Rework | Public registration remains relevant. |

## Shared Package (`packages/shared/src`)

| Item | Classification | Notes |
| --- | --- | --- |
| constants | Review | Retain useful enums; remove legacy references. |
| types | Rework | Update to new domain model later. |
| utils | Review | Keep general-purpose helpers only. |

## Documentation & Misc

| Path | Classification | Notes |
| --- | --- | --- |
| README.md | Rework | Needs builder-first narrative. |
| docs/prd.md | Rework | Update to reflect 80% scope truth. |
| docs-reference/* | Review | Keep reference materials; archive outdated ones. |
| scripts/*.js | Review | Remove unused utilities, keep dev essentials. |

> **Legend**: *Keep* – no major changes; *Rework* – retained but rebuilt/refined; *Archive* – move to `.archive/` for reference.
