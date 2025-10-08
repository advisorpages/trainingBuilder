# Session Builder v2.0 - Monitoring & Operations Guide

## Overview

This guide covers production readiness, monitoring, and operations for the Session Builder v2.0 multi-variant generation system.

## Feature Flags

### Master Control

**`ENABLE_VARIANT_GENERATION_V2`** (boolean, default: `false`)
- Master switch for multi-variant generation
- When `false`, all requests fall back to legacy single-variant generation
- When `true`, variant generation is controlled by rollout percentage

**`VARIANT_GENERATION_ROLLOUT_PERCENTAGE`** (number, 0-100, default: `0`)
- Controls gradual rollout of v2 features
- `0` = disabled (all requests use legacy)
- `1-99` = gradual rollout (percentage of users get v2)
- `100` = full rollout (all users get v2)
- Uses deterministic sampling based on request metadata

### RAG Kill Switch

**`RAG_API_URL`** (string, optional)
- Leave empty or unset to completely disable RAG integration
- When disabled, all variants use baseline AI generation
- No external API calls will be made

### Analytics Control

**`LOG_VARIANT_SELECTIONS`** (boolean, default: `true`)
- Tracks which variants users select
- Stores selections in AI interactions table
- Used for A/B testing and quality analysis

**`GOOGLE_ANALYTICS_ID`** (string, optional)
- Google Analytics tracking ID for frontend events
- When set, tracks variant generation and selection events

## Monitoring & Observability

### Key Metrics to Track

#### 1. Variant Generation Performance
- **Processing Time**: Total time to generate 4 variants (target: <25s)
- **RAG Query Time**: Time to query RAG service (target: <2s)
- **Individual Variant Time**: Time per variant generation (target: <8s each)

#### 2. Success Rates
- **Variant Generation Success Rate**: Percentage of successful generations (target: >95%)
- **RAG Availability**: Percentage of successful RAG queries (target: >90%)
- **Fallback Rate**: How often fallback to legacy is triggered

#### 3. User Engagement
- **RAG Variant Selection Rate**: How often users select RAG-powered variants (target: >50%)
- **Variant Comparison Time**: Time users spend comparing variants
- **Selection Distribution**: Which variants (1-4) are selected most

#### 4. Quality Metrics
- **RAG Similarity Scores**: Average similarity of RAG results
- **Sources Used**: Number of RAG sources per generation
- **Category Match Rate**: How well RAG results match requested category

### Structured Logging

All variant generation events are logged with structured data:

```typescript
// Variant generation request
{
  level: 'log',
  message: 'Variant generation v2 request received',
  category: string,
  sessionType: string,
  rolloutPercentage: number,
  rolloutSample: number,
  decisionReason: string,
  timestamp: ISO8601
}

// RAG query results
{
  level: 'log',
  message: 'RAG query completed',
  resultsFound: number,
  ragAvailable: boolean,
  averageSimilarity: number,
  queryTime: number,
  timestamp: ISO8601
}

// Individual variant generation
{
  level: 'log',
  message: 'Variant {N} generated',
  ragWeight: number,
  sectionsCount: number,
  totalDuration: number,
  timestamp: ISO8601
}

// Complete response
{
  level: 'log',
  message: 'Multi-variant generation completed',
  totalDuration: number,
  totalSections: number,
  processingTime: number,
  timestamp: ISO8601
}
```

### Analytics Events

Backend telemetry tracks:

1. **`ai_prompt_submitted`** - When variant generation is requested
   - Metadata: category, sessionType, rolloutPercentage, variantMode

2. **`ai_content_generated`** - When variants are successfully generated
   - Metadata: variantMode, processingTime, totalVariants, ragAvailable

3. **`ai_content_accepted`** - When a variant is selected
   - Metadata: variantId, generationSource, ragWeight, category

4. **`ai_content_rejected`** - When variant selection fails
   - Metadata: variantId, error details

Frontend Google Analytics tracks:

1. **`variant_generation_complete`**
   - Category: "Session Builder v2"
   - Label: "rag" or "baseline"
   - Value: Processing time in ms

2. **`variant_selected`**
   - Category: "Session Builder v2"
   - Label: Variant label
   - Value: RAG weight percentage

## Error Handling & Alerting

### Critical Errors (Immediate Alert)

1. **RAG Service Completely Down**
   - Log: `RAG query failed completely, proceeding with baseline only`
   - Action: Check RAG service health, falls back to baseline automatically

2. **All Variant Generation Failures**
   - Log: `All variants failed to generate`
   - Action: Check OpenAI API status and quota

3. **Database Logging Failures**
   - Log: `Failed to log variant selection`
   - Action: Check database connectivity, analytics continues

### Warning Conditions (Review Required)

1. **High RAG Failure Rate (>10%)**
   - Monitor RAG availability metric
   - May indicate RAG service issues

2. **Slow Generation Times (>30s)**
   - Monitor processing time metric
   - May indicate OpenAI API slowness

3. **Low RAG Variant Selection (<30%)**
   - Monitor selection rate metric
   - May indicate poor RAG quality

## Deployment & Rollout Strategy

### Phase 1: Internal Testing (Week 1)
```bash
ENABLE_VARIANT_GENERATION_V2=true
VARIANT_GENERATION_ROLLOUT_PERCENTAGE=0  # Manual testing only
```

### Phase 2: Beta Test (Week 2)
```bash
ENABLE_VARIANT_GENERATION_V2=true
VARIANT_GENERATION_ROLLOUT_PERCENTAGE=10  # 10% of users
```
- Monitor metrics closely
- Gather user feedback
- Fix critical issues

### Phase 3: Staged Rollout (Week 3)
```bash
ENABLE_VARIANT_GENERATION_V2=true
VARIANT_GENERATION_ROLLOUT_PERCENTAGE=50  # 50% of users
```
- Compare v2 vs legacy metrics
- Validate performance improvements

### Phase 4: Full Rollout (Week 4+)
```bash
ENABLE_VARIANT_GENERATION_V2=true
VARIANT_GENERATION_ROLLOUT_PERCENTAGE=100  # All users
```
- Monitor for regressions
- Document learnings

### Emergency Rollback

If critical issues are found:

```bash
# Option 1: Complete disable
ENABLE_VARIANT_GENERATION_V2=false

# Option 2: Disable RAG only (keep v2 with baseline)
RAG_API_URL=

# Option 3: Reduce rollout
VARIANT_GENERATION_ROLLOUT_PERCENTAGE=0
```

## Performance Optimization

### RAG Service Optimization

1. **Timeout Tuning**
   ```bash
   RAG_TIMEOUT_MS=10000  # Start with 10s
   ```
   - Adjust based on p95 response times
   - Consider reducing if RAG is consistently fast

2. **Retry Logic**
   ```bash
   RAG_RETRY_ATTEMPTS=1  # Single retry by default
   ```
   - Increase if transient failures are common
   - Decrease to fail faster if RAG is unreliable

3. **Similarity Threshold**
   ```bash
   RAG_SIMILARITY_THRESHOLD=0.65  # Medium quality bar
   ```
   - Increase (0.7-0.8) for higher quality results
   - Decrease (0.5-0.6) for more results

### OpenAI API Optimization

1. **Token Limits**
   - RAG context limited to 3000 tokens at weight=1.0
   - Scaled down proportionally at lower weights
   - Prevents excessive API costs

2. **Parallel Generation**
   - 4 variants generated in parallel
   - Uses Promise.all for concurrent requests
   - Reduces total time vs sequential

## Troubleshooting

### Common Issues

#### Issue: Variant generation times out
**Symptoms**: Requests taking >30s, timeouts
**Causes**:
- OpenAI API slowness
- RAG service slow responses
- Large context sizes

**Solutions**:
1. Check OpenAI API status
2. Verify RAG service performance
3. Reduce RAG context (lower similarity threshold)
4. Increase timeouts temporarily

#### Issue: Low RAG variant selection
**Symptoms**: Users selecting baseline variant >70% of time
**Causes**:
- Poor RAG result quality
- Irrelevant knowledge base content
- Category mismatch

**Solutions**:
1. Review RAG similarity scores
2. Check category matching accuracy
3. Adjust RAG weights (similarity/recency/category)
4. Improve knowledge base content

#### Issue: High memory usage
**Symptoms**: Backend memory growing over time
**Causes**:
- Telemetry events accumulating (10k max in memory)

**Solutions**:
1. Monitor telemetry event count
2. Export events periodically
3. Clear old events: `analyticsTelemetry.clearOldEvents(cutoffDate)`

## API Endpoints for Monitoring

### Get Telemetry Metrics

```bash
# AI Interaction Metrics
GET /api/analytics/ai-metrics
GET /api/analytics/ai-metrics?start=2025-01-01&end=2025-01-31

# Builder Usage Metrics
GET /api/analytics/builder-metrics
GET /api/analytics/builder-metrics?start=2025-01-01&end=2025-01-31

# Recent Events
GET /api/analytics/events?limit=100
GET /api/analytics/events?type=ai_content_generated&limit=50

# Event Statistics
GET /api/analytics/stats
GET /api/analytics/stats?start=2025-01-01&end=2025-01-31

# Export Events
GET /api/analytics/export?format=json
GET /api/analytics/export?format=csv&start=2025-01-01
```

### Health Check Endpoints

```bash
# Overall health
GET /api/health

# RAG service health (if available)
GET /api/rag/health

# Feature flag status
GET /api/config/features
```

## Success Criteria

### Technical Success
- ✅ All 4 variants generate successfully >95% of time
- ✅ RAG integration works with <5% error rate
- ✅ Average generation time <25s
- ✅ Duration balancing functions correctly
- ✅ Analytics tracking captures all events
- ✅ Feature flags enable safe rollout

### User Experience Success
- ✅ Loading animation is engaging (subjective)
- ✅ Variant selection is clear and easy
- ✅ RAG variants selected >50% of time
- ✅ Error handling is graceful

### Business Success
- ✅ Users publish sessions 20% faster
- ✅ Session quality scores improve by 10+ points
- ✅ No disruption to existing workflows

## Additional Resources

- **Environment Variables**: See `.env.example` for all configuration options
- **API Documentation**: `/docs-reference/tribeRAG-API_DOCUMENTATION.md`
- **Development Plan**: `/implement-this-dev-plan.md`
- **Code Location**: `/packages/backend/src/modules/sessions/sessions.service.ts`
