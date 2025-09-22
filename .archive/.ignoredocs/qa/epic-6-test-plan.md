# Epic 6: Incentive Management Testing Plan

## Test Scope
Incentive creation workflow, AI content generation for incentives, publishing, and cloning functionality.

## Prerequisites
- [ ] All previous epics (1-5) tests passed
- [ ] Content Developer authentication working
- [ ] AI service configured for incentive content generation
- [ ] Database schema supports incentive entities

## Story Testing

### 6.1 Incentive Worksheet UI
**Status:** ✅ Implementation Complete
- [ ] Access incentive creation from dashboard
- [ ] Incentive worksheet form displays all fields:
  - [ ] Incentive title/name
  - [ ] Description/details
  - [ ] Incentive type (discount, bonus, reward, etc.)
  - [ ] Value/amount (percentage, fixed amount)
  - [ ] Validity period (start and end dates)
  - [ ] Applicable sessions (multi-select)
  - [ ] Terms and conditions
  - [ ] Usage limits (total uses, per-user limits)
- [ ] Form validation working:
  - [ ] Required field validation
  - [ ] Date validation (end date after start date)
  - [ ] Value validation (positive numbers, percentages)
  - [ ] Session selection validation
- [ ] Responsive design on mobile/tablet
- [ ] Auto-save functionality (if implemented)

### 6.2 Save Incentive Draft
**Status:** ✅ Implementation Complete
- [ ] Save incentive draft without AI content
- [ ] Draft saves with partial completion
- [ ] Draft retrieval and editing
- [ ] Draft list view for Content Developer
- [ ] Draft status indicators
- [ ] Draft deletion functionality
- [ ] Unsaved changes warning
- [ ] Draft auto-save behavior

### 6.3 One-Step AI Content Generation
**Status:** ✅ Implementation Complete
- [ ] AI generates all required incentive content in single step:
  - [ ] Promotional headline
  - [ ] Marketing description
  - [ ] Call-to-action text
  - [ ] Social media snippets
  - [ ] Email subject lines
  - [ ] Terms and conditions template
- [ ] Generated content displays organized by type
- [ ] Content editing capability after generation
- [ ] Content regeneration option
- [ ] AI generation error handling
- [ ] Content quality validation
- [ ] Multiple content variations (if implemented)

### 6.4 Incentive Publishing
**Status:** ✅ Implementation Complete
- [ ] Publish completed incentives
- [ ] Publishing validation:
  - [ ] All required fields completed
  - [ ] Valid date ranges
  - [ ] Associated sessions exist and are published
  - [ ] AI content generated
- [ ] Published incentives status change
- [ ] Published incentives appear in relevant contexts:
  - [ ] Session registration pages
  - [ ] Public incentive listings
  - [ ] Email campaigns (if implemented)
- [ ] Unpublish capability with validation
- [ ] Publishing audit trail

### 6.5 Clone Incentive
**Status:** ✅ Implementation Complete
- [ ] Clone existing incentive functionality
- [ ] Clone creates new draft with copied data:
  - [ ] Title appended with "Copy" or similar
  - [ ] All form fields copied
  - [ ] AI content copied (if exists)
  - [ ] New unique identifier assigned
- [ ] Clone from both draft and published incentives
- [ ] Clone editing works independently
- [ ] Clone bulk operations (if implemented)
- [ ] Clone history tracking

## Integration Testing

### Cross-Epic Dependencies
- [ ] Incentives associate with sessions from Epic 2/3
- [ ] Published incentives appear on public pages (Epic 5)
- [ ] Incentive data visible in trainer dashboard (Epic 4)
- [ ] Registration system applies incentives (Epic 5)

### AI Service Integration
- [ ] AI content generation API calls
- [ ] Content quality and appropriateness
- [ ] Generation time acceptable (< 20 seconds)
- [ ] Error handling for AI failures
- [ ] Rate limiting management

### Database Integration
- [ ] Incentive data persistence
- [ ] Relationships with sessions maintained
- [ ] Draft/published status handling
- [ ] Clone data integrity
- [ ] Concurrent editing handling

## Workflow Testing

### Complete Incentive Creation Flow
1. [ ] Login as Content Developer
2. [ ] Navigate to incentive creation
3. [ ] Fill out incentive worksheet
4. [ ] Save initial draft
5. [ ] Generate AI content
6. [ ] Review and edit AI content
7. [ ] Finalize incentive details
8. [ ] Publish incentive
9. [ ] Verify incentive appears in appropriate contexts

### Incentive Cloning Flow
1. [ ] Navigate to existing incentive list
2. [ ] Select incentive to clone
3. [ ] Execute clone operation
4. [ ] Edit cloned incentive details
5. [ ] Modify AI content if needed
6. [ ] Save as new draft
7. [ ] Publish cloned incentive

### Incentive Application Flow
1. [ ] User views session with associated incentive
2. [ ] Incentive displays prominently on session page
3. [ ] User registers for session
4. [ ] Incentive automatically applied (if applicable)
5. [ ] Confirmation shows incentive benefit

## Business Rules Testing

### Incentive Validation Rules
- [ ] End date must be after start date
- [ ] Incentive value must be positive
- [ ] Associated sessions must be published
- [ ] Usage limits must be reasonable
- [ ] Overlapping incentive handling

### Publishing Rules
- [ ] Only complete incentives can be published
- [ ] Published incentives cannot be deleted
- [ ] Unpublishing requires validation (no active usage)
- [ ] Status change audit logging

## Performance Testing
- [ ] Incentive worksheet loads < 3 seconds
- [ ] AI content generation completes < 20 seconds
- [ ] Draft save operations < 2 seconds
- [ ] Incentive list loads efficiently
- [ ] Clone operations complete quickly
- [ ] Publishing operations responsive

## User Experience Testing
- [ ] Intuitive incentive creation workflow
- [ ] Clear content generation progress indicators
- [ ] Helpful validation error messages
- [ ] Consistent terminology throughout
- [ ] Mobile-friendly interface
- [ ] Keyboard navigation support

## Security Testing
- [ ] Content Developer role required for access
- [ ] Incentive ownership validation
- [ ] AI content sanitization
- [ ] XSS protection on user inputs
- [ ] Audit logging for all operations
- [ ] Rate limiting on AI generations

## API Endpoint Testing
- [ ] `POST /incentives` - Create incentive draft
- [ ] `PUT /incentives/{id}` - Update incentive
- [ ] `GET /incentives/{id}` - Retrieve incentive
- [ ] `POST /incentives/{id}/ai-content` - Generate AI content
- [ ] `POST /incentives/{id}/publish` - Publish incentive
- [ ] `POST /incentives/{id}/clone` - Clone incentive
- [ ] `GET /incentives` - List incentives with filtering

## Error Handling Testing
- [ ] AI service failures during content generation
- [ ] Network timeouts during operations
- [ ] Invalid form submissions
- [ ] Concurrent editing conflicts
- [ ] Database constraint violations
- [ ] Publishing validation failures

## Test Data Requirements
```sql
-- Test incentive data
INSERT INTO incentives (title, description, type, value, start_date, end_date, status, created_by) VALUES
  ('Early Bird Discount', '20% off for early registration', 'percentage', 20.0, '2024-01-01', '2024-03-31', 'draft', 'dev@test.com'),
  ('Group Booking Bonus', 'Special rate for 5+ attendees', 'fixed', 100.0, '2024-02-01', '2024-04-30', 'published', 'dev@test.com');

-- Test incentive-session associations
INSERT INTO incentive_sessions (incentive_id, session_id) VALUES
  (1, 1),
  (1, 2),
  (2, 3);

-- Test AI-generated content
INSERT INTO incentive_ai_content (incentive_id, content_type, content_text, generated_at) VALUES
  (1, 'headline', 'Don\'t Miss Out! Early Bird Special', NOW()),
  (1, 'description', 'Register now and save 20% on this exclusive training opportunity', NOW());
```

## Mock AI Responses for Incentive Content
```json
{
  "incentive_content": {
    "headline": "Limited Time: 20% Early Bird Discount!",
    "marketing_description": "Take advantage of our exclusive early bird pricing and secure your spot at this transformative workshop while saving 20% on registration fees.",
    "call_to_action": "Register Now & Save 20%",
    "social_snippets": [
      "🎯 Early Bird Special: 20% off leadership workshop! Register today #Leadership #EarlyBird",
      "⏰ Limited time offer: Save 20% on professional development training"
    ],
    "email_subjects": [
      "Last Chance: 20% Early Bird Discount Expires Soon",
      "Secure Your Spot & Save 20% - Early Bird Special"
    ],
    "terms_template": "This 20% discount applies to registration fees only. Valid for registrations completed by [end date]. Cannot be combined with other offers. Full terms available at registration."
  }
}
```

## Incentive Types Testing
```javascript
// Test different incentive types
const incentiveTypes = [
  { type: 'percentage', value: 20, display: '20% off' },
  { type: 'fixed_amount', value: 50, display: '$50 off' },
  { type: 'early_bird', value: 15, display: '15% early bird discount' },
  { type: 'group_rate', value: 10, display: '10% group discount (5+ people)' },
  { type: 'bonus', value: 0, display: 'Free resource bundle included' }
];
```

## Test Results Template
```
Test Date: ___________
Tester: ___________
Environment: ___________

Epic 6 Test Results:
[ ] Story 6.1: _____ (Pass/Fail/Notes)
[ ] Story 6.2: _____ (Pass/Fail/Notes)
[ ] Story 6.3: _____ (Pass/Fail/Notes)
[ ] Story 6.4: _____ (Pass/Fail/Notes)
[ ] Story 6.5: _____ (Pass/Fail/Notes)

Incentive Workflow Results:
[ ] Creation Flow: _____ (Pass/Fail/Notes)
[ ] AI Content Generation: _____ (Pass/Fail/Notes)
[ ] Publishing Flow: _____ (Pass/Fail/Notes)
[ ] Cloning Flow: _____ (Pass/Fail/Notes)

Integration Results:
[ ] Session Association: _____ (Pass/Fail/Notes)
[ ] Public Display: _____ (Pass/Fail/Notes)
[ ] Registration Application: _____ (Pass/Fail/Notes)

Critical Issues Found:
- Issue 1: _____
- Issue 2: _____

Epic 6 Overall Status: Pass/Fail
```