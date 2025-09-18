# Epic 2: Core Content Creation Testing Plan

## Test Scope
Session creation workflow including worksheet UI, AI integration, and content generation.

## Prerequisites
- [ ] Epic 1 (Foundation) tests passed
- [ ] User authentication working
- [ ] Trainers and locations available in system
- [ ] AI service API keys configured
- [ ] Test user accounts for Content Developer role

## Story Testing

### 2.1 Session Worksheet UI
**Status:** ✅ Implementation Complete
- [ ] Access session creation from dashboard
- [ ] Worksheet form displays all required fields:
  - [ ] Session title input
  - [ ] Description textarea
  - [ ] Date/time picker
  - [ ] Duration selection
  - [ ] Trainer dropdown (populated from Epic 1)
  - [ ] Location dropdown (populated from Epic 1)
  - [ ] Topic/category selection
  - [ ] Capacity/max attendees input
- [ ] Form validation working:
  - [ ] Required field validation
  - [ ] Date/time validation (future dates only)
  - [ ] Capacity validation (positive numbers)
  - [ ] Trainer availability checking
- [ ] Responsive design on mobile/tablet
- [ ] Auto-save functionality (if implemented)

### 2.2 Save Session Draft
**Status:** ✅ Implementation Complete
- [ ] Save draft without AI content generation
- [ ] Draft saves with partial form completion
- [ ] Draft retrieval and editing
- [ ] Draft list view for Content Developer
- [ ] Draft status indicator
- [ ] Draft deletion functionality
- [ ] Unsaved changes warning when navigating away
- [ ] Draft auto-save (if implemented)

### 2.3 AI Prompt Generation and Review
**Status:** ✅ Implementation Complete
- [ ] AI prompt generation triggered from complete session form
- [ ] Generated prompt displays for review
- [ ] Prompt editing capability
- [ ] Prompt regeneration option
- [ ] Prompt approval/proceed functionality
- [ ] Prompt saving for audit trail
- [ ] Error handling for AI service failures
- [ ] Timeout handling for slow AI responses

### 2.4 AI Copy Generation and Display
**Status:** ✅ Implementation Complete
- [ ] AI promotional copy generation from approved prompt
- [ ] Generated content displays properly formatted
- [ ] Multiple content sections generated:
  - [ ] Session description
  - [ ] Marketing copy
  - [ ] Social media snippets
  - [ ] Email content (if applicable)
- [ ] Content preview functionality
- [ ] Content editing capability
- [ ] Copy-to-clipboard functionality
- [ ] Character count indicators

### 2.5 Iterative Content Regeneration
**Status:** ✅ Implementation Complete
- [ ] Request content regeneration with same prompt
- [ ] Request content regeneration with modified prompt
- [ ] Compare multiple generated versions
- [ ] Select preferred content version
- [ ] Undo/redo functionality for content changes
- [ ] Content version history tracking
- [ ] Batch regeneration of specific sections

### 2.6 Save AI Content to Draft
**Status:** ✅ Implementation Complete
- [ ] Save approved AI content to session draft
- [ ] Session status update to include AI content
- [ ] Content versioning and tracking
- [ ] Draft completeness indicators
- [ ] Integration with Epic 3 (publishing workflow)
- [ ] Content backup and recovery

## Integration Testing

### Cross-Epic Dependencies
- [ ] Session data flows to Epic 3 (Publishing)
- [ ] Trainer assignments flow to Epic 4 (Trainer Dashboard)
- [ ] Session content flows to Epic 5 (Public Pages)
- [ ] Draft sessions exclude from public view until published

### AI Service Integration
- [ ] API authentication working
- [ ] Request/response format validation
- [ ] Rate limiting handling
- [ ] Service downtime graceful degradation
- [ ] Content quality validation
- [ ] Inappropriate content filtering

### Database Integration
- [ ] Session drafts persist correctly
- [ ] Foreign key relationships maintained
- [ ] Concurrent editing handling
- [ ] Data integrity during AI operations
- [ ] Audit trail for AI generations

## Workflow Testing

### Complete Session Creation Flow
1. [ ] Login as Content Developer
2. [ ] Navigate to session creation
3. [ ] Fill out session worksheet
4. [ ] Save initial draft
5. [ ] Generate AI prompt
6. [ ] Review and approve prompt
7. [ ] Generate AI content
8. [ ] Review generated content
9. [ ] Iterate content if needed
10. [ ] Save final session with AI content
11. [ ] Verify session ready for publishing

### Error Recovery Testing
- [ ] Network interruption during AI generation
- [ ] AI service timeout handling
- [ ] Invalid AI response handling
- [ ] Form data recovery after errors
- [ ] Partial save state recovery

## Performance Testing
- [ ] Worksheet form loads < 3 seconds
- [ ] Draft save completes < 2 seconds
- [ ] AI prompt generation < 10 seconds
- [ ] AI content generation < 30 seconds
- [ ] Form validation responds < 1 second
- [ ] Auto-save doesn't impact user experience

## User Experience Testing
- [ ] Intuitive navigation through creation process
- [ ] Clear progress indicators
- [ ] Helpful validation messages
- [ ] Loading states during AI operations
- [ ] Mobile-friendly interface
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility

## Security Testing
- [ ] Content Developer role required for access
- [ ] Session ownership validation
- [ ] AI prompt injection protection
- [ ] XSS protection on AI-generated content
- [ ] Content sanitization before display
- [ ] Audit logging for AI generations

## API Endpoint Testing
- [ ] `POST /sessions` - Create session draft
- [ ] `PUT /sessions/{id}` - Update session draft
- [ ] `GET /sessions/{id}` - Retrieve session draft
- [ ] `POST /sessions/{id}/ai-prompt` - Generate AI prompt
- [ ] `POST /sessions/{id}/ai-content` - Generate AI content
- [ ] `DELETE /sessions/{id}` - Delete session draft

## Test Data Requirements
```sql
-- Test session data
INSERT INTO session_drafts (title, description, trainer_id, location_id, start_time, duration, capacity, created_by) VALUES
  ('Leadership Workshop', 'Test session description', 1, 1, '2024-01-15 10:00:00', 120, 30, 'dev@test.com');

-- AI prompt test data
INSERT INTO ai_prompts (session_id, prompt_text, status, created_at) VALUES
  (1, 'Generate promotional copy for leadership workshop...', 'approved', NOW());
```

## Mock AI Responses
```json
{
  "prompt_generation": {
    "prompt": "Create engaging promotional copy for a leadership workshop titled 'Leadership Excellence' scheduled for January 15th...",
    "confidence": 0.95
  },
  "content_generation": {
    "description": "Join us for an transformative leadership workshop...",
    "marketing_copy": "Unlock your leadership potential...",
    "social_snippets": ["#Leadership #Growth", "Transform your team..."]
  }
}
```

## Test Results Template
```
Test Date: ___________
Tester: ___________
Environment: ___________

Epic 2 Test Results:
[ ] Story 2.1: _____ (Pass/Fail/Notes)
[ ] Story 2.2: _____ (Pass/Fail/Notes)
[ ] Story 2.3: _____ (Pass/Fail/Notes)
[ ] Story 2.4: _____ (Pass/Fail/Notes)
[ ] Story 2.5: _____ (Pass/Fail/Notes)
[ ] Story 2.6: _____ (Pass/Fail/Notes)

AI Integration Results:
[ ] Prompt Generation: _____ (Pass/Fail/Notes)
[ ] Content Generation: _____ (Pass/Fail/Notes)
[ ] Error Handling: _____ (Pass/Fail/Notes)

Critical Issues Found:
- Issue 1: _____
- Issue 2: _____

Epic 2 Overall Status: Pass/Fail
```