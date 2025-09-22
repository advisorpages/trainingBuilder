# Epic 6: Incentive Management - Brownfield Enhancement

## Epic Goal

Build a streamlined incentive creation and management system that allows Content Developers to create time-bound promotional incentives with AI-generated content, following the existing session creation patterns.

## Epic Description

**Existing System Context:**

- Current relevant functionality: Session creation workflow with AI content generation, user authentication with role-based access, dynamic grid dashboard layout
- Technology stack: React/TypeScript frontend with Vite, Express/Node.js backend with TypeScript, PostgreSQL with Prisma ORM
- Integration points: Existing AI service abstraction layer, authentication middleware, dashboard grid components, form validation patterns

**Enhancement Details:**

- What's being added/changed: New incentive management workflow parallel to session management, including creation form, AI content generation, publishing status, and dashboard integration
- How it integrates: Reuses existing UI patterns (worksheet layout, dynamic grid), authentication/authorization system, AI service layer, and database connection
- Success criteria: Content Developers can create, edit, publish incentives in under 3 minutes; incentives appear in dashboard grid; AI generates compelling promotional copy

## Stories

1. **Story 6.1:** Incentive Worksheet UI - Create incentive creation form following session worksheet patterns with fields for title, description, rules, dates, and target audience
2. **Story 6.2:** Save Incentive Draft - Implement draft saving functionality using existing session draft patterns and database structure
3. **Story 6.3:** One-Step AI Content Generation - Integrate with existing AI service to generate promotional copy, titles, and descriptions in single workflow step

## Compatibility Requirements

- [x] Existing APIs remain unchanged (new endpoints only)
- [x] Database schema changes are backward compatible (new tables only)
- [x] UI changes follow existing patterns (worksheet layout, dynamic grid)
- [x] Performance impact is minimal (similar to session creation workflow)

## Risk Mitigation

- **Primary Risk:** Integration complexity with existing AI service layer and authentication system
- **Mitigation:** Follow established patterns from session creation workflow; reuse existing components and services
- **Rollback Plan:** Incentive features are additive - can be disabled via feature flags; database tables can be isolated

## Definition of Done

- [x] All stories completed with acceptance criteria met
- [x] Existing functionality verified through testing (session creation, authentication, dashboard)
- [x] Integration points working correctly (AI service, database, authentication)
- [x] Documentation updated appropriately (API docs, user guides)
- [x] No regression in existing features (sessions, trainer dashboard, public pages)

## Validation Checklist

**Scope Validation:**

- [x] Epic can be completed in 3 stories maximum
- [x] No architectural documentation is required (follows existing patterns)
- [x] Enhancement follows existing patterns (worksheet UI, AI integration, grid dashboard)
- [x] Integration complexity is manageable (reuses existing services and components)

**Risk Assessment:**

- [x] Risk to existing system is low (additive feature with isolated database tables)
- [x] Rollback plan is feasible (feature flags, isolated database changes)
- [x] Testing approach covers existing functionality (regression testing)
- [x] Team has sufficient knowledge of integration points (established patterns from sessions)

**Completeness Check:**

- [x] Epic goal is clear and achievable (incentive management workflow)
- [x] Stories are properly scoped (UI, data persistence, AI integration)
- [x] Success criteria are measurable (creation time under 3 minutes, dashboard integration)
- [x] Dependencies are identified (existing AI service, authentication, UI components)

---

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing system running React/TypeScript frontend with Express/Node.js backend and PostgreSQL database
- Integration points: Existing AI service abstraction layer, authentication middleware (JWT with role-based access), dashboard dynamic grid components, form validation patterns with React Hook Form, Prisma ORM database layer
- Existing patterns to follow: Session worksheet UI layout, AI content generation workflow, draft/publish status management, dynamic grid dashboard cards
- Critical compatibility requirements: Must integrate with existing Content Developer role permissions, follow established API patterns, use existing database connection and ORM patterns, maintain consistent UI/UX with session creation workflow
- Each story must include verification that existing functionality remains intact (session creation, trainer dashboard, public registration pages)

The epic should maintain system integrity while delivering streamlined incentive creation and management capabilities for Content Developers."

---