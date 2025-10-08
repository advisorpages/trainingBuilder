# RAG Portal API Documentation

## Overview

The RAG Portal API is a comprehensive document ingestion, search, and chat system built with FastAPI. It provides endpoints for uploading documents, performing hybrid search (BM25 + vector similarity), and engaging in AI-powered conversations with citation support.

### Key Features

- **Document Ingestion Pipeline**: Upload documents through presigned URLs with automatic processing
- **Hybrid Search**: Combines traditional BM25 scoring with vector similarity search
- **RAG Chat**: Conversational AI with source citations and context awareness
- **Document Management**: Browse, filter, and manage document collections
- **Job Processing**: Asynchronous processing pipeline with status tracking
- **Multi-format Support**: Handles PDF, DOCX, PPTX, TXT, MD, and various video/audio formats

### Architecture

- **Backend**: FastAPI with async/await support
- **Database**: PostgreSQL for metadata and relational data
- **Vector Store**: Qdrant for semantic search capabilities
- **File Storage**: MinIO for document and artifact storage
- **Message Queue**: Redis Streams for job processing
- **AI Services**: OpenAI for embeddings, chat completion, and transcription

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Make utility
- The system runs on `http://localhost:8000` by default

### Setup

1. **Clone and configure**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start services**:
   ```bash
   make up
   ```

3. **Initialize database and storage**:
   ```bash
   make migrate    # PostgreSQL schema
   make qdrant     # Vector collection
   make seed       # Prompt templates
   ```

4. **Verify health**:
   ```bash
   curl http://localhost:8000/health
   ```

The API will be available at `http://localhost:8000` with automatic OpenAPI/Swagger documentation at `http://localhost:8000/docs`.

## API Endpoints

### Document Ingestion

#### 1. Create Presigned Upload URL

**POST** `/intake/presign`

Generate a presigned URL for direct upload to MinIO storage.

**Request Body**:
```json
{
  "filename": "document.pdf",
  "category": "research",
  "series_id": "optional-series-id",
  "sequence_number": 1
}
```

**Response**:
```json
{
  "doc_id": "doc_123456789",
  "version": 1,
  "upload_url": "https://minio.example.com/presigned-url",
  "object_key": "research/series/doc_123/v1/document.pdf"
}
```

**Usage Example**:
```bash
# Get presigned URL
response=$(curl -X POST "http://localhost:8000/intake/presign" \
  -H "Content-Type: application/json" \
  -d '{"filename": "research.pdf", "category": "research"}')

upload_url=$(echo $response | jq -r '.upload_url')

# Upload file directly to MinIO
curl -X PUT "$upload_url" \
  -H "Content-Type: application/pdf" \
  --data-binary "@research.pdf"
```

#### 2. Confirm Upload and Start Processing

**POST** `/intake/confirm`

Trigger the ingestion pipeline after uploading a file.

**Request Body**:
```json
{
  "doc_id": "doc_123456789",
  "object_key": "research/series/doc_123/v1/document.pdf",
  "mime_type": "application/pdf",
  "title": "Optional document title"
}
```

**Response**:
```json
{
  "job_id": "job_987654321"
}
```

#### 3. Check Processing Status

**GET** `/intake/status/{doc_id}`

Monitor the document processing pipeline status.

**Response**:
```json
{
  "doc_id": "doc_123456789",
  "status": "completed",
  "current_stage": "catalog_update",
  "last_updated": "2024-01-15T10:30:00Z"
}
```

**Status Values**:
- `pending`: Job queued but not started
- `processing`: Currently being processed
- `completed`: Successfully processed
- `failed`: Processing failed (check error details)

**Stages** (in order):
1. `intake_normalize` - File validation and normalization
2. `media_extract` - Audio/video extraction (if applicable)
3. `audio_segment` - Audio segmentation for large files
4. `asr` - Automatic speech recognition/transcription
5. `chunk` - Document chunking with overlap
6. `embed` - Vector embedding generation
7. `enrich` - Metadata enrichment (keywords, entities, topics)
8. `catalog_update` - Database and search index updates

### Search

#### 4. Hybrid Search

**POST** `/search`

Perform hybrid search combining BM25 keyword search with vector similarity.

**Request Body**:
```json
{
  "query": "machine learning algorithms",
  "filters": {
    "category": "research",
    "series_id": "ml-series",
    "keywords": ["supervised", "classification"]
  }
}
```

**Response**:
```json
{
  "hits": [
    {
      "doc_id": "doc_123456789",
      "chunk_id": "chunk_001",
      "score": 0.875,
      "snippet": "Machine learning algorithms can be broadly classified into supervised and unsupervised learning methods...",
      "path": "research/ml-series/doc_123/v1/chunks/chunk_001.json"
    },
    {
      "doc_id": "doc_987654321",
      "chunk_id": "chunk_045",
      "score": 0.823,
      "snippet": "Recent advances in deep learning have revolutionized computer vision applications...",
      "path": "research/cv-series/doc_987/v1/chunks/chunk_045.json"
    }
  ]
}
```

**Scoring**: Results are scored from 0.0 to 1.0, combining:
- BM25 relevance score (keyword matching)
- Vector similarity score (semantic similarity)
- Recency boost (newer documents score higher)

### Chat

#### 5. RAG Chat

**POST** `/chat`

Engage in conversational AI with source citations.

**Request Body**:
```json
{
  "session_id": "chat_session_123",
  "prompt_id": "default_chat",
  "message": "What are the main types of machine learning algorithms?"
}
```

**Response**:
```json
{
  "reply": "Based on the documents in your knowledge base, there are several main types of machine learning algorithms:\n\n1. **Supervised Learning**: Algorithms that learn from labeled training data...\n2. **Unsupervised Learning**: Algorithms that find patterns in unlabeled data...\n3. **Reinforcement Learning**: Algorithms that learn through interaction with an environment...\n\nThese algorithms are discussed in detail across multiple research documents in your collection.",
  "citations": [
    {
      "doc_id": "doc_123456789",
      "chunk_id": "chunk_001",
      "url": "/browse?doc_id=doc_123456789&chunk=chunk_001"
    },
    {
      "doc_id": "doc_456789123",
      "chunk_id": "chunk_012",
      "url": "/browse?doc_id=doc_456789123&chunk=chunk_012"
    }
  ]
}
```

**Available Prompt Templates**:
- `default_chat`: General conversational AI
- `summarizer`: Document summarization
- `explainer`: Technical concept explanations
- `comparator`: Compare and contrast concepts

### Document Management

#### 6. List Documents

**GET** `/documents`

Retrieve documents with optional filtering.

**Query Parameters**:
- `status`: Filter by processing status (`pending`, `processing`, `completed`, `failed`)
- `category`: Filter by document category
- `limit`: Maximum results (default: 100, max: 1000)
- `offset`: Pagination offset

**Response**:
```json
{
  "documents": [
    {
      "doc_id": "doc_123456789",
      "version": 1,
      "title": "Machine Learning Fundamentals",
      "status": "completed",
      "visibility": true,
      "category": "research",
      "updated_at": "2024-01-15T10:30:00Z",
      "metadata": {
        "summary": "Comprehensive overview of ML algorithms and applications",
        "keywords": ["machine learning", "algorithms", "supervised learning"],
        "entities": ["OpenAI", "TensorFlow", "PyTorch"],
        "topics": ["artificial intelligence", "data science"]
      },
      "latest_job": {
        "job_id": "job_987654321",
        "job_type": "ingestion",
        "stage": "completed",
        "status": "success",
        "attempts": 1,
        "updated_at": "2024-01-15T10:30:00Z"
      }
    }
  ]
}
```

#### 7. Update Document

**PATCH** `/documents`

Perform actions on documents.

**Request Body**:
```json
{
  "doc_id": "doc_123456789",
  "action": "soft_delete"
}
```

**Actions**:
- `soft_delete`: Mark document as deleted (can be restored)
- `reindex`: Trigger reprocessing of the document

### Job Management

#### 8. List Jobs

**GET** `/jobs`

Monitor background job processing.

**Query Parameters**:
- `status`: Filter by job status (`pending`, `running`, `completed`, `failed`)
- `limit`: Maximum results (default: 50, max: 200)

**Response**:
```json
{
  "jobs": [
    {
      "job_id": "job_987654321",
      "doc_id": "doc_123456789",
      "doc_title": "Machine Learning Fundamentals",
      "job_type": "ingestion",
      "stage": "embed",
      "status": "running",
      "attempts": 1,
      "last_error": null,
      "updated_at": "2024-01-15T10:25:00Z"
    }
  ]
}
```

#### 9. Retry Failed Job

**POST** `/jobs/{job_id}/retry`

Retry a failed background job.

**Response**:
```json
{
  "job_id": "job_987654321",
  "status": "retry_queued"
}
```

## Data Models

### Document Schema

```typescript
interface Document {
  doc_id: string;           // Unique document identifier
  version: number;          // Document version (increments on reprocessing)
  title?: string;           // Human-readable title
  status: string;           // Processing status
  visibility: boolean;      // Whether document is visible in search
  category: string;         // Document category for organization
  updated_at: string;       // ISO timestamp of last update
  metadata?: {
    summary?: string;       // AI-generated summary
    keywords: string[];     // Extracted keywords
    entities: string[];     // Named entities found in content
    topics: string[];       // Main topics/themes
  };
  latest_job?: {
    job_id: string;         // Associated job ID
    job_type: string;       // Type of job (ingestion, reindex, etc.)
    stage: string;          // Current processing stage
    status: string;         // Job status
    attempts: number;       // Number of retry attempts
    last_error?: string;    // Last error message if failed
    updated_at: string;     // Last update timestamp
  };
}
```

### Search Hit Schema

```typescript
interface SearchHit {
  doc_id: string;           // Source document ID
  chunk_id: string;         // Specific chunk within document
  score: number;            // Relevance score (0.0 to 1.0)
  snippet: string;          // Text snippet with query context
  path: string;             // Path to chunk file in storage
}
```

### Chat Citation Schema

```typescript
interface ChatCitation {
  doc_id: string;           // Source document ID
  chunk_id: string;         // Specific chunk being cited
  url: string;              // Deep link to source material
}
```

## Error Handling

All API endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "The requested document does not exist",
    "details": {
      "doc_id": "nonexistent_doc"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request body/query parameters are invalid
- `DOCUMENT_NOT_FOUND`: Document does not exist or is not accessible
- `JOB_NOT_FOUND`: Background job does not exist
- `PROCESSING_FAILED`: Document processing failed
- `STORAGE_ERROR`: File storage operation failed
- `SEARCH_ERROR`: Search operation failed
- `QUOTA_EXCEEDED`: API rate limit or storage quota exceeded

## Best Practices

### Document Upload

1. **Use presigned URLs**: Always use `/intake/presign` to get upload URLs rather than uploading directly
2. **Confirm uploads**: Always call `/intake/confirm` after uploading to trigger processing
3. **Monitor status**: Poll `/intake/status/{doc_id}` to track processing progress
4. **Handle retries**: Be prepared to retry failed uploads or processing jobs

### Search Optimization

1. **Use filters**: Leverage category and keyword filters to narrow search scope
2. **Batch requests**: For multiple searches, consider batching related queries
3. **Cache results**: Search results can be cached on your end for frequently accessed queries

### Chat Integration

1. **Session management**: Maintain consistent `session_id` for related conversations
2. **Prompt selection**: Choose appropriate prompt templates for your use case
3. **Citation handling**: Process and display citations to provide source context

### Performance Considerations

1. **Async processing**: Document ingestion is asynchronous - don't wait for completion
2. **Connection pooling**: Reuse HTTP connections when making multiple API calls
3. **Rate limiting**: Implement client-side rate limiting to respect API limits
4. **Error handling**: Implement proper retry logic with exponential backoff

## Configuration

### Environment Variables

Key configuration options (from `.env`):

```bash
# API Configuration
ENV=dev
TZ=America/Toronto

# Database
PGHOST=postgres
PGPORT=5432
PGUSER=rag
PGPASSWORD=your_password
PGDATABASE=ragdb

# Vector Store
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION=rag_chunks

# File Storage
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=archive

# AI Services
OPENAI_API_KEY=your_openai_key
EMBEDDINGS_MODEL=text-embedding-3-large
ENRICH_MODEL=gpt-4
WHISPER_MODEL=whisper-1
```

## Troubleshooting

### Common Issues

#### Upload Failures

**Problem**: Document upload fails with storage error
**Solution**:
1. Verify MinIO is running and accessible
2. Check that presigned URL hasn't expired (typically 1 hour)
3. Ensure file size doesn't exceed limits (default: 100MB)
4. Verify file format is supported

#### Search Returns No Results

**Problem**: Search queries return empty results
**Solution**:
1. Check if documents have completed processing (`status: completed`)
2. Verify documents are visible (`visibility: true`)
3. Try broader search terms or remove filters
4. Check if vector store is properly initialized

#### Chat Citations Missing

**Problem**: Chat responses don't include citations
**Solution**:
1. Ensure relevant documents are processed and searchable
2. Verify the prompt template supports citations
3. Check that search is returning relevant results

#### Performance Issues

**Problem**: API calls are slow or timing out
**Solution**:
1. Check system resource usage (CPU, memory, disk)
2. Verify database and vector store performance
3. Consider optimizing search filters for large datasets
4. Monitor background job queue length

### Debugging

#### Enable Debug Logging

Set log level in environment:
```bash
LOG_LEVEL=DEBUG
```

#### Check System Health

```bash
# API health
curl http://localhost:8000/health

# Database connectivity
curl http://localhost:8000/debug/db-status

# Vector store status
curl http://localhost:8000/debug/qdrant-status
```

#### Monitor Background Jobs

```bash
# List recent jobs
curl "http://localhost:8000/jobs?limit=20"

# Check specific job status
curl "http://localhost:8000/jobs/job_123"
```

## Support

For additional support or questions:

1. Check the OpenAPI documentation at `http://localhost:8000/docs`
2. Review application logs in Docker containers
3. Monitor system metrics and performance
4. Check the project repository for updates and issues

## Version History

- **v0.1.0**: Initial release with core RAG functionality
  - Document ingestion pipeline
  - Hybrid search capabilities
  - RAG chat with citations
  - Basic document and job management

## License

This API is part of the RAG Portal project. See project LICENSE for details.