# Incentive System API Documentation

## Overview

This document provides detailed API documentation for the Incentive Management System endpoints. All endpoints follow RESTful conventions and return JSON responses.

## Base URL

```
https://api.leadership-training.app/api/incentives
```

## Authentication

Most endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Public endpoints are marked with `[PUBLIC]` and do not require authentication.

## Response Format

### Success Response

```json
{
  "data": <response_data>,
  "status": "success"
}
```

### Error Response

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400
  },
  "status": "error"
}
```

## Data Models

### Incentive Model

```typescript
interface Incentive {
  id: string;                    // UUID
  title: string;                 // Max 255 characters
  description?: string;          // Max 2000 characters, optional
  rules?: string;               // Max 2000 characters, optional
  startDate: string;            // ISO 8601 date string
  endDate: string;              // ISO 8601 date string
  status: IncentiveStatus;      // 'draft' | 'published' | 'expired' | 'cancelled'
  authorId: string;             // UUID of creating user
  aiGeneratedContent?: string;  // AI-generated content, optional
  isActive: boolean;            // Soft delete flag
  createdAt: string;           // ISO 8601 timestamp
  updatedAt: string;           // ISO 8601 timestamp
  author: User;                // Populated user object
}
```

### Create/Update DTOs

```typescript
interface CreateIncentiveDto {
  title: string;                // Required, max 255 chars
  description?: string;         // Optional, max 2000 chars
  rules?: string;              // Optional, max 2000 chars
  startDate: string;           // Required, ISO 8601 date
  endDate: string;             // Required, ISO 8601 date
  aiGeneratedContent?: string; // Optional, max 2000 chars
}

interface UpdateIncentiveDto {
  title?: string;
  description?: string;
  rules?: string;
  startDate?: string;
  endDate?: string;
  aiGeneratedContent?: string;
}
```

## Endpoints

### System Status

#### Get System Status

```http
GET /api/incentives/status
```

**Description**: Returns the current status of the incentive system.

**Auth**: Required (Content Developer)

**Response**:
```json
{
  "module": "Incentives",
  "status": "Active - Incentive Management",
  "features": [
    "Incentive creation and management",
    "Draft save and auto-save functionality",
    "AI content integration",
    "Clone functionality"
  ]
}
```

---

### Public Endpoints

#### Get Active Incentives `[PUBLIC]`

```http
GET /api/incentives/public/active
```

**Description**: Returns all published, non-expired incentives for public display.

**Auth**: None required

**Query Parameters**: None

**Response**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Early Bird Special",
    "description": "Register early and save 20%",
    "rules": "Valid for registrations before March 1st",
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-03-01T23:59:59Z",
    "status": "published",
    "authorId": "author-uuid",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "author": {
      "id": "author-uuid",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

---

### CRUD Operations

#### Create Incentive

```http
POST /api/incentives
```

**Description**: Creates a new incentive draft.

**Auth**: Required (Content Developer)

**Request Body**:
```json
{
  "title": "New Year Special",
  "description": "Start the year with leadership training",
  "rules": "Valid through January 2024",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "aiGeneratedContent": "Optional AI-generated promotional content"
}
```

**Response**: `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "New Year Special",
  "description": "Start the year with leadership training",
  "rules": "Valid through January 2024",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "status": "draft",
  "authorId": "current-user-uuid",
  "aiGeneratedContent": "Optional AI-generated promotional content",
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "author": { /* user object */ }
}
```

**Validation Errors**:
- `400 Bad Request`: End date must be after start date
- `400 Bad Request`: Title is required
- `400 Bad Request`: Start and end dates are required

#### Get All Incentives

```http
GET /api/incentives
```

**Description**: Returns all incentives for the current user (Content Developer view).

**Auth**: Required (Content Developer)

**Response**: `200 OK`
```json
[
  {
    "id": "incentive-uuid",
    "title": "Incentive Title",
    // ... full incentive object
  }
]
```

#### Get Incentive by ID

```http
GET /api/incentives/{id}
```

**Description**: Returns a specific incentive by ID.

**Auth**: Required (Content Developer)

**Path Parameters**:
- `id` (string, required): UUID of the incentive

**Response**: `200 OK` - Incentive object

**Errors**:
- `404 Not Found`: Incentive not found

#### Update Incentive

```http
PATCH /api/incentives/{id}
```

**Description**: Updates an existing incentive.

**Auth**: Required (Content Developer)

**Path Parameters**:
- `id` (string, required): UUID of the incentive

**Request Body**: `UpdateIncentiveDto` (partial update)
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response**: `200 OK` - Updated incentive object

**Errors**:
- `404 Not Found`: Incentive not found
- `400 Bad Request`: Validation errors

#### Delete Incentive

```http
DELETE /api/incentives/{id}
```

**Description**: Soft deletes an incentive (sets isActive to false).

**Auth**: Required (Content Developer)

**Path Parameters**:
- `id` (string, required): UUID of the incentive

**Response**: `204 No Content`

**Errors**:
- `404 Not Found`: Incentive not found

---

### Draft Management

#### Save Draft

```http
PATCH /api/incentives/{id}/draft
```

**Description**: Saves changes to an incentive draft with draft-specific validation.

**Auth**: Required (Content Developer)

**Path Parameters**:
- `id` (string, required): UUID of the incentive

**Request Body**: `UpdateIncentiveDto`

**Response**: `200 OK` - Updated incentive object

#### Get My Drafts

```http
GET /api/incentives/drafts/my
```

**Description**: Returns all draft incentives created by the current user.

**Auth**: Required (Content Developer)

**Response**: `200 OK` - Array of draft incentives

#### Auto-Save Draft

```http
POST /api/incentives/{id}/auto-save
```

**Description**: Auto-saves partial changes to a draft (for UI auto-save functionality).

**Auth**: Required (Content Developer)

**Path Parameters**:
- `id` (string, required): UUID of the incentive

**Request Body**: Partial incentive data
```json
{
  "title": "Partially updated title"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "lastSaved": "2024-01-15T10:30:00Z"
}
```

#### Check Draft Saveability

```http
GET /api/incentives/{id}/saveable
```

**Description**: Checks if a draft can be saved (validation without saving).

**Auth**: Required (Content Developer)

**Path Parameters**:
- `id` (string, required): UUID of the incentive

**Response**: `200 OK`
```json
{
  "saveable": true
}
```

---

### Publishing

#### Publish Incentive

```http
POST /api/incentives/{id}/publish
```

**Description**: Publishes a draft incentive, making it publicly visible.

**Auth**: Required (Content Developer)

**Path Parameters**:
- `id` (string, required): UUID of the incentive

**Response**: `200 OK` - Updated incentive with status 'published'

**Validation**:
- Incentive must be in 'draft' status
- All required fields must be completed
- Dates must be valid (start date in future, end date after start date)

**Errors**:
- `400 Bad Request`: Incentive validation failed
- `404 Not Found`: Incentive not found

#### Unpublish Incentive

```http
DELETE /api/incentives/{id}/unpublish
```

**Description**: Unpublishes an incentive, returning it to draft status.

**Auth**: Required (Content Developer)

**Path Parameters**:
- `id` (string, required): UUID of the incentive

**Response**: `200 OK` - Updated incentive with status 'draft'

**Errors**:
- `400 Bad Request`: Only published incentives can be unpublished
- `404 Not Found`: Incentive not found

---

### Clone Functionality

#### Clone Incentive

```http
POST /api/incentives/{id}/clone
```

**Description**: Creates a copy of an existing incentive as a new draft.

**Auth**: Required (Content Developer)

**Path Parameters**:
- `id` (string, required): UUID of the source incentive to clone

**Response**: `201 Created` - New incentive object
```json
{
  "id": "new-uuid",
  "title": "Original Title (Copy)",
  "description": "Copied description",
  "rules": "Copied rules",
  "startDate": "2024-02-01T00:00:00Z",  // Reset to current date + 1 day
  "endDate": "2024-02-08T00:00:00Z",    // Reset to current date + 8 days
  "status": "draft",                     // Always draft for clones
  "authorId": "current-user-uuid",       // Set to cloning user
  "aiGeneratedContent": "Copied AI content",
  "isActive": true,
  "createdAt": "2024-01-15T11:00:00Z",  // New creation time
  "updatedAt": "2024-01-15T11:00:00Z",
  "author": { /* current user object */ }
}
```

**Clone Behavior**:
- Copies all content fields (title, description, rules, aiGeneratedContent)
- Appends "(Copy)" to the title
- Resets status to 'draft'
- Sets new author as the cloning user
- Generates new UUID for the clone
- Resets dates to reasonable defaults
- Preserves content but creates independent copy

**Errors**:
- `404 Not Found`: Source incentive not found
- `403 Forbidden`: Insufficient permissions

---

### Query Parameters & Filtering

#### Get Incentives by Author

```http
GET /api/incentives/author/{authorId}
```

**Description**: Returns all incentives created by a specific author.

**Auth**: Required (Content Developer)

**Path Parameters**:
- `authorId` (string, required): UUID of the author

**Response**: `200 OK` - Array of incentives

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INCENTIVE_NOT_FOUND` | Incentive with specified ID not found | 404 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `PERMISSION_DENIED` | Insufficient permissions for operation | 403 |
| `AUTHENTICATION_REQUIRED` | Valid JWT token required | 401 |
| `INCENTIVE_ALREADY_PUBLISHED` | Cannot modify published incentive | 400 |
| `INVALID_DATE_RANGE` | Start date must be before end date | 400 |
| `TITLE_REQUIRED` | Incentive title is required | 400 |

## Rate Limiting

Certain endpoints have rate limiting applied:

- **Clone operations**: 5 requests per minute per user
- **Auto-save operations**: 30 requests per minute per user
- **Public endpoints**: 100 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1609459200
```

## Usage Examples

### Creating and Publishing an Incentive

```javascript
// 1. Create draft
const createResponse = await fetch('/api/incentives', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Summer Leadership Camp',
    description: 'Intensive 3-day leadership development',
    rules: 'Valid for sessions in July and August',
    startDate: '2024-07-01T00:00:00Z',
    endDate: '2024-08-31T23:59:59Z'
  })
});

const incentive = await createResponse.json();

// 2. Publish the incentive
const publishResponse = await fetch(`/api/incentives/${incentive.id}/publish`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  }
});
```

### Cloning an Incentive

```javascript
// Clone existing incentive
const cloneResponse = await fetch('/api/incentives/original-uuid/clone', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  }
});

const clonedIncentive = await cloneResponse.json();
// clonedIncentive.title will be "Original Title (Copy)"
// clonedIncentive.status will be "draft"
```

### Auto-Save Functionality

```javascript
// Auto-save draft changes
const autoSaveResponse = await fetch('/api/incentives/draft-uuid/auto-save', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Updated title during editing'
  })
});

const result = await autoSaveResponse.json();
// { success: true, lastSaved: "2024-01-15T10:30:00Z" }
```

## Changelog

### Version 1.0.0 (Epic 6 Release)
- Initial incentive CRUD operations
- Draft management system
- Publishing workflow
- Clone functionality (Story 6.5)
- Public display endpoints
- AI integration support