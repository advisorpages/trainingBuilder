# Phase 4 – Supporting Modules Integration

## Goal
Reconnect supporting workflows (topics, incentives, landing pages, trainer tools, public site) to the new backend while keeping the builder as the editing hub. Transform existing admin interfaces into streamlined CRUD operations that integrate seamlessly with the builder workflow.

## Inputs
- Phase 2 backend APIs for satellites (sessions, topics, incentives, landing-pages, trainers, users modules)
- Phase 3 builder UI and shared components (BuilderLayout, UI components, session-builder features)
- Current entity relationships (Session-centric domain with satellite tables)
- Existing PRD requirements for role-based access and workflow integration

## Core Tasks

### 1. Sessions Listing & Management (`/sessions`)
**Implementation Priority**: High - Core workflow dependency
- **Data Requirements**:
  - Session entity with status, readiness metrics, AI generation timestamps
  - Related topics, trainers, incentives for filtering
  - Session content versions for "last updated" indicators
- **UI Components**:
  - Reuse existing `packages/frontend/src/ui/` components (Card, Button, Progress)
  - Data table with sortable columns (Status, Title, Topic, Trainer, Last Update)
  - Status badges using SessionStatus enum (DRAFT, REVIEW, READY, PUBLISHED, RETIRED)
  - Quick action buttons: "Edit in Builder", "Preview", "Publish", "Archive"
- **Features**:
  - Advanced filtering by status, topic, trainer assignment
  - Bulk operations for publishing/archiving multiple sessions
  - Readiness score indicators (Phase 5 dependency - stub for now)
  - Direct links to builder: `/sessions/builder/:id`

### 2. Topics Admin (`/topics`)
**Implementation Priority**: High - Builder integration dependency
- **Backend Requirements**:
  - Leverage existing `packages/backend/src/modules/topics/` CRUD endpoints
  - Add session count and usage analytics to Topic entity responses
- **UI Components**:
  - Simple data table with inline editing capabilities
  - Quick-add modal (reuse from builder's QuickAddModal pattern)
  - "Sessions Using" column showing count + link to filtered session list
- **Builder Integration**:
  - Modal opens from builder topic selection
  - Real-time sync between builder and admin views
  - Prevent deletion of topics with active sessions (soft delete or warning)

### 3. Incentives Admin (`/incentives`)
**Implementation Priority**: Medium - Builder workflow enhancement
- **Backend Requirements**:
  - Extend existing `packages/backend/src/modules/incentives/` service
  - Add session relationship tracking and cloning functionality
- **UI Components**:
  - CRUD table with scheduling controls (date ranges, activation status)
  - Clone action for duplicating successful incentives
  - Session dependency warnings before deletion
- **Features**:
  - Usage analytics: which sessions link to each incentive
  - Schedule management with activation/expiration dates
  - Template system for common incentive types

### 4. Landing Pages Module (`/landing-pages`)
**Implementation Priority**: Medium - Publishing workflow completion
- **Backend Requirements**:
  - Complete `packages/backend/src/modules/landing-pages/` implementation
  - Connect to session publishing pipeline via SessionStatusLog
  - Version control for marketing customizations
- **UI Components**:
  - Split-view editor: generated content (left) + customizations (right)
  - Live preview with responsive breakpoint testing
  - Publish/unpublish toggles with rollback capabilities
- **Features**:
  - Marketing team can override AI-generated copy
  - A/B testing framework (Phase 5 enhancement)
  - SEO optimization fields (meta tags, descriptions)

### 5. Trainer Dashboard (`/trainer`)
**Implementation Priority**: High - Core trainer workflow
- **Backend Requirements**:
  - Extend `packages/backend/src/modules/trainers/` with assignment logic
  - TrainerAssignment entity for session relationships
  - TrainerAsset entity for generated materials
- **UI Components**:
  - Calendar view of upcoming assignments
  - Session prep materials download/view
  - AI coaching tips display with acknowledgment tracking
  - Email notification preferences
- **Features**:
  - Session material packages (slides, handouts, notes)
  - Prep checklist with completion tracking
  - Feedback collection post-session

### 6. Public Facing Pages (`/public`)
**Implementation Priority**: Medium - End-user experience
- **Backend Requirements**:
  - Public API endpoints (no authentication required)
  - QR code generation service integration
  - Session registration flow
- **UI Components**:
  - Responsive landing pages consuming published session data
  - Registration forms with validation
  - QR code display and download functionality
- **Features**:
  - SEO-optimized session pages
  - Social media integration (Open Graph, Twitter cards)
  - Analytics tracking (registration conversions)

### 7. Navigation & Permissions
**Implementation Priority**: High - Security and UX foundation
- **Role-Based Access Control**:
  - Content Developer: Full access to builder, sessions, topics, incentives, landing pages
  - Trainer: Read-only dashboard access, session materials, feedback submission
  - Admin: All modules + user management
- **Navigation Updates**:
  - Extend existing `BuilderLayout` navigation items
  - Context-aware menus based on user role
  - Breadcrumb navigation for deep linking

## Implementation Timeline & Dependencies

### Week 1: Foundation Setup
- **Backend API Extensions**: Complete missing endpoints in topics, incentives, landing-pages modules
- **Frontend Routing**: Set up new routes and integrate with existing `BuilderLayout`
- **Authentication Integration**: Extend role-based guards for new modules

### Week 2: High Priority Modules
- **Sessions Management Page**: Core listing with filters and bulk actions
- **Topics Admin**: CRUD interface with builder integration
- **Navigation & Permissions**: Role-based access implementation

### Week 3: Trainer & Public Workflows
- **Trainer Dashboard**: Assignment views and material access
- **Public Pages**: Landing page display and registration flows

### Week 4: Enhancement Modules
- **Incentives Admin**: Advanced CRUD with scheduling
- **Landing Page Editor**: Marketing customization interface
- **QR Code Integration**: Generate and manage codes for published sessions

## Technical Implementation Notes

### Shared Component Strategy
- Extend existing UI components in `packages/frontend/src/ui/`
- Reuse builder patterns from `packages/frontend/src/features/session-builder/`
- Maintain consistent styling with BuilderLayout design system

### API Integration Patterns
- Use React Query for data fetching consistency with builder
- Implement optimistic updates for CRUD operations
- Cache invalidation strategies for real-time sync between modules

### Database Considerations
- Leverage existing entity relationships (Session → Topic, Session → Incentive)
- Add soft delete capabilities for entities referenced by sessions
- Implement audit logging for admin actions via SessionStatusLog

## Deliverables

### Functional Components
- **Sessions Management Interface** (`/sessions`)
  - Data table with filtering, sorting, bulk operations
  - Status workflow controls (draft → review → ready → published)
  - Builder integration links and readiness indicators

- **Admin Interfaces** (`/topics`, `/incentives`, `/landing-pages`)
  - CRUD operations with validation and dependency checking
  - Usage analytics and session relationship displays
  - Quick-add modals accessible from builder workflow

- **Trainer Dashboard** (`/trainer`)
  - Assignment calendar and upcoming session views
  - Downloadable training materials and coaching tips
  - Acknowledgment tracking and feedback collection

- **Public Session Pages** (`/public/sessions/:id`)
  - SEO-optimized landing pages with registration forms
  - QR code generation and social media integration
  - Analytics tracking for conversion optimization

### Technical Documentation
- **API Documentation**: Updated endpoint specifications for all modules
- **Component Library**: Documented shared UI components and patterns
- **Permission Matrix**: Role-based access control specifications
- **Integration Guide**: Builder ↔ Admin workflow documentation

## Test Plan

### 1. Automated Tests
**Frontend Component Tests**
- Unit tests for new page components using existing test patterns
- Filter/sort functionality validation in session management table
- Modal behavior testing for quick-add workflows
- Role-based UI rendering verification

**Backend Integration Tests**
- CRUD operation validation for topics, incentives, landing-pages modules
- Session relationship integrity (topics with active sessions cannot be deleted)
- Publishing pipeline side effects (session status updates, notifications)
- API endpoint authorization based on user roles

### 2. End-to-End Testing
**Core Workflows**
```
Test Scenario: Complete Session Lifecycle
1. Content Developer creates session in builder
2. Adds new topic via quick-add modal from builder
3. Links incentive and assigns trainer
4. Publishes session from sessions management page
5. Verify: public landing page displays correctly
6. Verify: trainer dashboard shows new assignment
7. Verify: incentive appears in admin with session link
```

**Regression Protection**
- Screenshot comparison for public pages across devices
- UI consistency checks between builder and admin interfaces
- Navigation flow validation for each user role

### 3. Manual QA Scenarios
**Role-Based Access Testing**
- Content Developer: Full access verification to all admin modules
- Trainer: Dashboard-only access, cannot modify sessions/topics
- Public: Landing page access without authentication

**Data Integrity Validation**
- Prevention of topic deletion when sessions are using it
- Session count accuracy in topics admin interface
- Incentive scheduling conflicts detection

**User Experience Validation**
- Responsive design on mobile/tablet devices
- Accessibility compliance (keyboard navigation, screen readers)
- Loading states and error handling for slow network conditions

### 4. Performance & Security Testing
**Performance Benchmarks**
- Lighthouse scores for public session pages (target: 90+ performance)
- Admin interface response times under load (target: < 300ms)
- Builder ↔ admin synchronization latency

**Security Validation**
- API endpoint authentication enforcement
- SQL injection prevention in search/filter queries
- XSS protection in user-generated content display

## Handoff Checklist

### Backend Completion
- [ ] All CRUD endpoints implemented and documented for topics, incentives, landing-pages modules
- [ ] Session relationship integrity enforced (foreign keys, soft deletes)
- [ ] Role-based API guards implemented and tested
- [ ] Email notification system integrated with trainer assignments
- [ ] QR code generation service connected to publishing pipeline

### Frontend Completion
- [ ] Sessions management page with filtering, bulk operations, and builder links
- [ ] Topics admin with usage analytics and quick-add modal integration
- [ ] Incentives admin with scheduling controls and dependency warnings
- [ ] Trainer dashboard with calendar, materials, and feedback collection
- [ ] Public landing pages with SEO optimization and registration forms
- [ ] Landing page editor with marketing customization capabilities

### Integration & Testing
- [ ] All routes accessible via updated BuilderLayout navigation
- [ ] Role-based access control fully implemented and validated
- [ ] Builder ↔ admin workflow seamless (quick-add modals, real-time sync)
- [ ] Playwright e2e scripts cover complete session lifecycle
- [ ] Performance benchmarks meet targets (300ms admin, 90+ Lighthouse)
- [ ] Accessibility compliance validated (WCAG 2.1 AA)

### Documentation & Handoff
- [ ] API documentation updated with new endpoints and permissions
- [ ] Component library documented with usage examples
- [ ] Permission matrix published for role-based access rules
- [ ] Integration guide completed for builder ↔ admin workflows
- [ ] Known issues and Phase 5 enhancements logged in project backlog
- [ ] Deployment guide updated with new environment variables and services

### Success Criteria Validation
- [ ] Sessions can be created in builder and managed via admin interface
- [ ] Topics/incentives are seamlessly accessible from both builder and admin
- [ ] Trainers receive complete session packages via dashboard
- [ ] Public pages display published sessions with registration capabilities
- [ ] All user roles have appropriate access restrictions enforced
- [ ] End-to-end workflow completed in < 5 minutes for experienced users
