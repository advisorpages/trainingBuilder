# Epic 3: Publishing Testing Plan

## Test Scope
Session publishing workflow including status management and content lifecycle.

## Prerequisites
- [ ] Epic 1 (Foundation) tests passed
- [ ] Epic 2 (Content Creation) tests passed
- [ ] Session drafts available with AI-generated content
- [ ] Content Developer role access verified

## Story Testing

### 3.1 Display Session Status
**Status:** ✅ Implementation Complete ✅ VERIFIED
- [ ] Session status displayed in draft list view
- [ ] Status indicators clearly visible:
  - [ ] Draft status (unpublished)
  - [ ] Ready for Review status
  - [ ] Published status
  - [ ] Archived status (if applicable)
- [ ] Status color coding/icons for visual clarity
- [ ] Status filtering in session list
- [ ] Status history tracking
- [ ] Status change timestamps
- [ ] Status-based permissions (who can see what)

### 3.2 Manual Status Updates
**Status:** ✅ Implementation Complete ✅ VERIFIED
- [ ] Content Developer can change session status
- [ ] Status change dropdown/buttons accessible
- [ ] Status change confirmation dialogs
- [ ] Status change validation:
  - [ ] Cannot publish incomplete sessions
  - [ ] Cannot unpublish sessions with registrations
  - [ ] Date validation for future sessions
- [ ] Status change audit trail
- [ ] Bulk status updates (if implemented)
- [ ] Status change notifications (if implemented)

### 3.3 System Logic for Publishing
**Status:** ✅ Implementation Complete ✅ VERIFIED
- [ ] Automated status progression logic
- [ ] Session validation before publishing:
  - [ ] Required fields completed
  - [ ] Valid date/time (future)
  - [ ] Trainer assigned and available
  - [ ] Location assigned and available
  - [ ] AI content generated and approved
- [ ] Auto-archive past sessions
- [ ] Publishing triggers integration events:
  - [ ] Session appears in trainer dashboard (Epic 4)
  - [ ] Session appears on public pages (Epic 5)
  - [ ] QR code generation triggered
- [ ] Rollback capability for published sessions

## Integration Testing

### Cross-Epic Dependencies
- [ ] Published sessions visible in Epic 4 (Trainer Dashboard)
- [ ] Published sessions appear in Epic 5 (Public Pages)
- [ ] Registration system only works with published sessions
- [ ] Draft sessions hidden from public view
- [ ] Status changes trigger appropriate notifications

### Database Integration
- [ ] Status changes persist correctly
- [ ] Status history maintained
- [ ] Referential integrity during status changes
- [ ] Concurrent status change handling
- [ ] Transaction rollback on validation failures

## Workflow Testing

### Complete Publishing Flow
1. [ ] Login as Content Developer
2. [ ] Navigate to session draft list
3. [ ] Select session with complete AI content
4. [ ] Verify session status shows "Draft"
5. [ ] Review session completeness
6. [ ] Change status to "Published"
7. [ ] Confirm status change
8. [ ] Verify session appears in appropriate lists
9. [ ] Verify session accessible in other epics

### Status Transition Testing
- [ ] Draft → Published (valid session)
- [ ] Draft → Published (incomplete session - should fail)
- [ ] Published → Draft (with no registrations)
- [ ] Published → Draft (with registrations - should fail)
- [ ] Published → Archived (past session)
- [ ] Status rollback scenarios

### Validation Testing
- [ ] Publish session without title (should fail)
- [ ] Publish session without trainer (should fail)
- [ ] Publish session without location (should fail)
- [ ] Publish session with past date (should fail)
- [ ] Publish session without AI content (should fail)
- [ ] Publish session with conflicting trainer schedule

## Business Rules Testing

### Publishing Rules
- [ ] Only Content Developers can publish sessions
- [ ] Sessions must be complete before publishing
- [ ] Published sessions cannot be deleted
- [ ] Status changes logged for audit
- [ ] Automatic status progression for time-based rules

### Visibility Rules
- [ ] Draft sessions only visible to creators
- [ ] Published sessions visible to all appropriate roles
- [ ] Archived sessions have restricted visibility
- [ ] Status-based filtering works correctly

## Performance Testing
- [ ] Status update response time < 2 seconds
- [ ] Session list with status loads < 3 seconds
- [ ] Bulk status operations complete reasonably
- [ ] Publishing validation completes < 5 seconds
- [ ] Status history queries perform adequately

## Security Testing
- [ ] Role-based access to status changes
- [ ] Session ownership validation
- [ ] Status change authorization checks
- [ ] Audit logging for all status changes
- [ ] Protection against unauthorized status manipulation

## User Experience Testing
- [ ] Clear status indicators and meanings
- [ ] Intuitive status change interface
- [ ] Helpful validation error messages
- [ ] Confirmation dialogs for critical changes
- [ ] Progress indicators during publishing
- [ ] Consistent status terminology throughout app

## API Endpoint Testing
- [ ] `GET /sessions` - List sessions with status filtering
- [ ] `PUT /sessions/{id}/status` - Update session status
- [ ] `GET /sessions/{id}/status-history` - Retrieve status history
- [ ] `POST /sessions/{id}/publish` - Publish session
- [ ] `POST /sessions/{id}/unpublish` - Unpublish session
- [ ] `GET /sessions/published` - List published sessions

## Error Handling Testing
- [ ] Database connection failures during status change
- [ ] Network timeouts during publishing
- [ ] Validation errors display clearly
- [ ] Concurrent status change conflicts
- [ ] Rollback handling for failed publications

## Test Data Requirements
```sql
-- Test sessions in various states
INSERT INTO sessions (title, description, status, trainer_id, location_id, start_time, created_by) VALUES
  ('Draft Session', 'Test draft session', 'draft', 1, 1, '2024-02-01 10:00:00', 'dev@test.com'),
  ('Published Session', 'Test published session', 'published', 1, 1, '2024-02-15 14:00:00', 'dev@test.com'),
  ('Past Session', 'Test past session', 'published', 1, 1, '2023-12-01 10:00:00', 'dev@test.com');

-- Status history test data
INSERT INTO session_status_history (session_id, old_status, new_status, changed_by, changed_at) VALUES
  (2, 'draft', 'published', 'dev@test.com', '2024-01-10 09:00:00');
```

## Status Validation Rules
```javascript
// Publishing validation rules to test
const publishingRules = {
  requiredFields: ['title', 'description', 'trainer_id', 'location_id', 'start_time'],
  futureDate: true,
  aiContentRequired: true,
  trainerAvailable: true,
  locationAvailable: true
};
```

## Test Results Template
```
Test Date: ___________
Tester: ___________
Environment: ___________

Epic 3 Test Results:
[ ] Story 3.1: _____ (Pass/Fail/Notes)
[ ] Story 3.2: _____ (Pass/Fail/Notes)
[ ] Story 3.3: _____ (Pass/Fail/Notes)

Status Workflow Results:
[ ] Draft → Published: _____ (Pass/Fail/Notes)
[ ] Published → Draft: _____ (Pass/Fail/Notes)
[ ] Status Validation: _____ (Pass/Fail/Notes)
[ ] Cross-Epic Integration: _____ (Pass/Fail/Notes)

Critical Issues Found:
- Issue 1: _____
- Issue 2: _____

Epic 3 Overall Status: Pass/Fail
```