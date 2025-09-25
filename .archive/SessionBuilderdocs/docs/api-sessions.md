# Sessions API Contract (Phase 2 Draft)

Base path: `/api/sessions`

## GET `/api/sessions`
Returns list of sessions with topic, incentives, landing page, and trainer assignment summaries.

**Response**
```json
[
  {
    "id": "uuid",
    "title": "Leading with Confidence",
    "status": "draft",
    "readinessScore": 40,
    "topic": { "id": "uuid", "name": "Leadership Foundations" },
    "incentives": [ { "id": "uuid", "name": "Early Bird Bonus" } ],
    "landingPage": { "id": "uuid", "slug": "leading-with-confidence" },
    "trainerAssignments": []
  }
]
```

## GET `/api/sessions/:id`
Returns a single session with agenda, content versions, and relationships.

## POST `/api/sessions`
Creates a draft session.

**Body**
```json
{
  "title": "string",
  "subtitle": "string",
  "audience": "string",
  "objective": "string",
  "topicId": "uuid",
  "incentiveIds": ["uuid"],
  "status": "draft",
  "readinessScore": 40
}
```

## PATCH `/api/sessions/:id`
Updates core metadata, topic linkage, incentives, status, and readiness score.

## POST `/api/sessions/:id/content`
Creates an AI content version record.

**Body**
```json
{
  "kind": "headline",
  "source": "ai",
  "content": { "text": "New headline" },
  "prompt": "Generate a headline",
  "promptVariables": { "tone": "inspiring" }
}
```

> Additional endpoints for readiness checks, agenda management, and publishing will be introduced in later phases.
