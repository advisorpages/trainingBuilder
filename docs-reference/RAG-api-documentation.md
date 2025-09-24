# tribeRAG2 API Documentation

## Overview

tribeRAG2 is a Retrieval-Augmented Generation (RAG) system that processes documents and videos, indexes their content using vector embeddings, and provides conversational querying capabilities.

## Architecture

- **Main API Server**: FastAPI (Python) running on port 8000
- **UI Layer**: Next.js API routes that proxy requests to the main API
- **Database**: PostgreSQL with pgvector extension for vector storage
- **Vector Store**: LlamaIndex with OpenAI text-embedding-3-large
- **LLM**: OpenAI GPT-4o
- **Real-time Updates**: WebSocket connections for progress tracking

## Base URLs

- **Direct API**: `http://your-host:8000`
- **UI Proxy API**: `http://your-host:3000/api` (forwards to main API)

## Authentication & Security

- **No authentication required** - all endpoints are open
- **CORS**: Allows all origins (`*`)
- **Required Environment Variables**:
  - `OPENAI_API_KEY`: Your OpenAI API key
  - `POSTGRES_USER`: Database username
  - `POSTGRES_PASSWORD`: Database password
  - `POSTGRES_HOST`: Database host
  - `POSTGRES_DB`: Database name

## API Endpoints

### File Upload & Processing

#### POST /upload-file/
Queue a single file for asynchronous processing.

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file`: File to upload (PDF, DOCX, TXT, MD, MP4, AVI, MOV, MKV, WEBM)
- `category`: Category string (optional, defaults to "General")

**Response**:
```json
{
  "status": "queued",
  "job_id": "uuid",
  "filename": "document.pdf",
  "category": "General",
  "message": "File queued for processing",
  "queue_position": 1
}
```

#### POST /upload-batch/
Upload multiple files concurrently.

**Content-Type**: `multipart/form-data`

**Parameters**:
- `files`: Multiple files
- `categories`: JSON string mapping file indices to categories

**Response**:
```json
{
  "status": "completed",
  "total_files": 3,
  "success_count": 3,
  "error_count": 0,
  "results": [...],
  "file_trackers": {...}
}
```

### Query & Chat

#### POST /query/
Query the RAG system.

**Content-Type**: `application/x-www-form-urlencoded`

**Parameters**:
- `query`: Search query string

**Response**:
```json
{
  "answer": "Response text",
  "sources": [
    {
      "text": "Source content",
      "metadata": {...},
      "score": 0.85,
      "rank": 1
    }
  ],
  "query_metadata": {
    "num_sources": 12,
    "query_length": 25
  }
}
```

### System Management

#### GET /api/health
System health check.

**Response**:
```json
{
  "api_status": "healthy",
  "database_status": "healthy",
  "openai_status": "healthy",
  "video_support": true,
  "video_registered": true,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### GET /api/stats
System statistics.

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 100)

**Response**:
```json
{
  "document_count": 150,
  "chunk_count": 2500,
  "recent_documents": [...],
  "recent_activities": [...],
  "error_count": 2,
  "pagination": {...},
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### Document Management

#### GET /api/documents-summary
Document summaries with pagination.

**Query Parameters**:
- `page`, `limit`, `category`, `search`

**Response**:
```json
{
  "documents": [
    {
      "filename": "document.pdf",
      "category": "General",
      "chunk_count": 45,
      "avg_chunk_size": 512,
      "total_text_size": 23040
    }
  ],
  "pagination": {...},
  "filters": {...}
}
```

#### DELETE /api/documents/{doc_id}
Delete document by chunk ID.

**Response**:
```json
{
  "status": "success",
  "message": "Document deleted successfully"
}
```

#### GET /api/documents/by-filename
Get document details by filename.

**Query Parameters**:
- `filename`: Exact filename
- `include_text`: Include preview text (default: true)
- `max_chars`: Max preview length (default: 2000)
- `fuzzy`: Fuzzy matching (default: false)
- `limit_matches`: Max fuzzy matches (default: 10)

**Response**:
```json
{
  "status": "success",
  "filename": "document.pdf",
  "chunk_count": 45,
  "categories": ["General"],
  "document_types": ["pdf"],
  "total_text_length": 23040,
  "language": "en",
  "avg_confidence": 0.95,
  "text_preview": "Document content preview..."
}
```

#### POST /api/reindex/by-filename
Reindex an existing file.

**Body** (JSON):
```json
{
  "filename": "document.pdf",
  "category": "New Category",
  "delete_existing": false
}
```

**Response**:
```json
{
  "status": "queued",
  "job_id": "uuid",
  "filename": "document.pdf",
  "category": "New Category",
  "message": "Reindex queued",
  "deleted_existing": 0
}
```

### Categories

#### GET /api/categories
Get all available categories.

**Response**:
```json
{
  "categories": ["General", "PFS Fundamental", "Presenting"],
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### POST /api/categories
Add a new category.

**Content-Type**: `application/x-www-form-urlencoded`

**Parameters**:
- `name`: Category name

**Response**:
```json
{
  "status": "success",
  "categories": ["General", "New Category"],
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### Job Queue Management

#### GET /api/queue/status
Get current queue status.

**Response**:
```json
{
  "status": "success",
  "queue_status": {...},
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### GET /api/jobs/{job_id}
Get status of a specific job.

**Response**:
```json
{
  "status": "success",
  "job": {
    "id": "uuid",
    "status": "completed",
    "filename": "document.pdf",
    "progress": 100
  }
}
```

#### GET /api/jobs
List jobs.

**Query Parameters**:
- `active_only`: Only active jobs (default: false)
- `limit`: Max jobs to return (default: 20)

**Response**:
```json
{
  "status": "success",
  "jobs": [...],
  "total_returned": 10,
  "queue_status": {...},
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### Legacy Endpoints

#### GET /api/progress/queue
Legacy queue status endpoint.

#### GET /api/progress/history
Processing history.

**Query Parameters**:
- `limit`: Max history items (default: 50)

#### POST /transcribe-and-index/
Transcribe and index audio file.

## WebSocket Endpoints

### WebSocket /ws/progress
Real-time progress updates for file processing.

**Initial Message**:
```json
{
  "type": "initial_state",
  "queue_status": {...},
  "active_processes": [...]
}
```

**Update Messages**:
```json
{
  "type": "queue_status",
  "data": {...}
}
```

### WebSocket /ws/queue
Queue status and job progress updates.

**Initial Message**:
```json
{
  "type": "initial_queue_state",
  "data": {
    "queue_status": {...},
    "active_jobs": [...],
    "recent_jobs": [...]
  }
}
```

## UI Proxy Endpoints

The Next.js UI provides proxy routes that forward to the main API:

- `GET /api/health` → `GET /api/health`
- `GET /api/stats` → `GET /api/stats`
- `GET/POST /api/categories` → `GET/POST /api/categories`
- `GET /api/documents-summary` → `GET /api/documents-summary`
- `POST /api/chat` → `POST /query/`
- `POST /api/upload-file` → `POST /upload-file/`
- `POST /api/upload-batch` → `POST /upload-batch/`

## Supported File Types

- **Documents**: PDF, DOCX, TXT, MD
- **Videos**: MP4, AVI, MOV, MKV, WEBM
- **Audio**: Various formats (via Whisper transcription)

## Error Handling

All endpoints return JSON with error information:

```json
{
  "error": "Error message description"
}
```

## Getting Started

1. Set up PostgreSQL with pgvector extension
2. Configure environment variables
3. Start the API server: `docker-compose up`
4. API available at `http://localhost:8000`
5. UI available at `http://localhost:3000`

## Default Categories

The system comes pre-configured with these categories:
- PFS Fundamental
- Presenting
- Closing
- Recruiting
- Licensing
- Prospecting
- Life Insurance
- Investments
- Planning
- Field Training

## Notes

- The API uses asynchronous processing for file uploads
- Video files are processed using Whisper for transcription
- PDF files are processed with multimodal analysis (text + images)
- All text is chunked and indexed with vector embeddings
- Queries use similarity search with reranking