# Bulk Export & Import Guide

The API now supports full-session and topic round trips so you can edit data offline and re-ingest updated records.

---

## Topics

### Export

```
GET /api/topics/export
```

Returns an array of topic objects sorted by name. Each entry includes:

```json
{
  "id": 12,
  "name": "Applying Mutual Funds to Client Scenarios",
  "description": "...",
  "learningOutcomes": "...",
  "trainerNotes": "...",
  "materialsNeeded": "...",
  "deliveryGuidance": "...",
  "isActive": true,
  "aiGeneratedContent": { ... },
  "createdAt": "2025-01-02T10:15:00.000Z",
  "updatedAt": "2025-01-15T14:32:00.000Z",
  "sessionIds": ["sess_123", "sess_456"]
}
```

### Import

```
POST /api/topics/import
Content-Type: application/json

{
  "topics": [
    {
      "id": 12,
      "name": "Applying Mutual Funds to Client Scenarios",
      "description": "...",
      "learningOutcomes": "...",
      "trainerNotes": "...",
      "materialsNeeded": "...",
      "deliveryGuidance": "...",
      "isActive": true
    }
  ]
}
```

- If `id` matches an existing topic, fields are updated in-place.
- If no `id` is supplied, the service attempts a case-insensitive match on name; otherwise a new topic is created.
- The response summarises `created`, `updated`, and `errors`.

---

## Sessions

### Export

```
GET /api/sessions/export
```

Each exported session contains:

```json
{
  "id": "sess_123",
  "title": "Mutual Fund Fundamentals for Client Advisors",
  "status": "published",
  "readinessScore": 96,
  "scheduledAt": "2025-02-03T10:00:00.000Z",
  "endTime": "2025-02-03T11:30:00.000Z",
  "durationMinutes": 90,
  "categoryId": 4,
  "categoryName": "Financial Services",
  "locationId": 7,
  "locationName": "HQ Training Room B",
  "audienceId": 3,
  "audienceName": "Client Advisory Team",
  "toneId": 2,
  "toneName": "Consultative",
  "objective": "Help advisors align mutual funds to client profiles",
  "publishedAt": "2025-01-20T15:42:00.000Z",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-22T08:10:00.000Z",
  "latestContentVersion": {
    "id": "ver_789",
    "kind": "AGENDA_SUMMARY",
    "status": "accepted",
    "source": "ai",
    "generatedAt": "2025-01-18T09:00:00.000Z",
    "content": { ... }
  },
  "contentVersions": [
    {
      "id": "ver_789",
      "kind": "AGENDA_SUMMARY",
      "status": "accepted",
      "source": "ai",
      "generatedAt": "2025-01-18T09:00:00.000Z",
      "createdAt": "2025-01-18T09:00:00.000Z",
      "updatedAt": "2025-01-18T09:05:00.000Z",
      "content": { ... }
    }
  ]
}
```

- `scheduledAt` reflects the session start; `endTime` is derived from `durationMinutes`.
- `latestContentVersion` gives a quick reference to the most recent or accepted agenda version, while `contentVersions` provides the full history for bulk edits.

### Import

```
POST /api/sessions/import
Content-Type: application/json

{
  "sessions": [
    {
      "id": "sess_123",
      "title": "Mutual Fund Fundamentals for Client Advisors",
      "status": "published",
      "readinessScore": 95,
      "startTime": "2025-02-03T10:00:00.000Z",
      "endTime": "2025-02-03T11:30:00.000Z",
      "durationMinutes": 90,
      "categoryId": 4,
      "locationId": 7,
      "audienceId": 3,
      "toneId": 2,
      "objective": "Updated objective text",
      "publishedAt": "2025-01-20T15:42:00.000Z"
    }
  ]
}
```

- Matching uses `id` first; if omitted, the service looks for an existing session with the same title.
- `readinessScore` is validated into a 0–100 range. If you set `status` to `published` and omit `publishedAt`, the importer auto-stamps the current time.
- Only base session fields are updated—content versions remain untouched. If you need to adjust content JSON, edit the exported payload and re-upload after removing immutable fields like IDs you don’t intend to change.
- Response mirrors the topics endpoint with `created`, `updated`, and `errors`.

---

## Workflow Tips

- Keep a version of the exported JSON before editing so you can diff changes or roll back.
- Use the same payload to update multiple records simultaneously—no need for one-off API calls.
- For large imports, run a small subset first to validate your format before bulk updates.
- All endpoints require standard authentication; make sure you’re logged in as an admin user.
