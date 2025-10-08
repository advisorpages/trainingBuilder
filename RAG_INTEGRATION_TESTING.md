# RAG Integration Testing Guide

## RAG Service Location
**URL:** `http://100.103.129.72`

## Quick Start - Testing with Live RAG

### 1. Configure Environment Variables

Create or update `packages/backend/.env`:

```bash
# Enable Session Builder v2.0 with RAG
ENABLE_VARIANT_GENERATION_V2=true
VARIANT_GENERATION_ROLLOUT_PERCENTAGE=100
LOG_VARIANT_SELECTIONS=true

# RAG Service Configuration
RAG_API_URL=http://100.103.129.72
RAG_SIMILARITY_WEIGHT=0.5
RAG_RECENCY_WEIGHT=0.2
RAG_CATEGORY_WEIGHT=0.2
RAG_SIMILARITY_THRESHOLD=0.65
RAG_TIMEOUT_MS=10000
RAG_RETRY_ATTEMPTS=1

# OpenAI Configuration (required)
OPENAI_API_KEY=your-actual-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

### 2. Start Services

```bash
# Terminal 1 - Backend
cd packages/backend
npm run start:dev

# Terminal 2 - Frontend
cd packages/frontend
npm run dev
```

### 3. Verify RAG Connectivity

Test the RAG service is accessible:

```bash
curl http://100.103.129.72/health
# or
curl http://100.103.129.72/api/health
```

## Manual Testing Checklist

### Test 1: RAG Service Health Check ✓

**Goal:** Verify RAG service is accessible and responding

**Steps:**
1. Backend should log RAG configuration on startup
2. Look for log: `RAG service configured: http://100.103.129.72`
3. No RAG connection errors on startup

**Expected:**
- Backend starts without RAG errors
- No timeout warnings

### Test 2: Variant Generation with RAG ✓

**Goal:** Generate 4 variants using real RAG data

**Steps:**
1. Navigate to Session Builder: `http://localhost:5173/sessions/builder/new`
2. Fill in required fields:
   - **Title:** "Effective Team Leadership"
   - **Category:** "Leadership" (or existing category in knowledge base)
   - **Desired Outcome:** "Improve team communication and collaboration"
   - **Session Type:** "Workshop"
   - **Location:** Select any location
3. Click "Generate Variants" button
4. Wait for variants to load (should be <25 seconds)

**Expected Results:**
- ✅ Loading animation shows progress
- ✅ 4 variants are generated
- ✅ At least 1-2 variants show "Knowledge Base-Driven" label
- ✅ RAG-powered variants have higher scores/weights
- ✅ Each variant shows section count and duration

**Check Backend Logs:**
```
[SessionsService] Variant generation v2 request received
[SessionsService] Starting multi-variant generation
[SessionsService] RAG query completed
  - resultsFound: X (should be > 0 for good categories)
  - ragAvailable: true
  - averageSimilarity: 0.XXX
[SessionsService] Variant 1 generated (ragWeight: 0.8)
[SessionsService] Variant 2 generated (ragWeight: 0.5)
[SessionsService] Variant 3 generated (ragWeight: 0.2)
[SessionsService] Variant 4 generated (ragWeight: 0.0)
[SessionsService] Multi-variant generation complete
```

### Test 3: RAG Result Quality ✓

**Goal:** Verify RAG returns relevant results

**Steps:**
1. Use a category that exists in your knowledge base
2. Generate variants
3. Inspect the RAG-powered variants

**Expected:**
- RAG variants contain content from knowledge base
- Similarity scores > 0.65 (threshold)
- Relevant topics/sections appear

**Check in Browser DevTools Console:**
```javascript
// Should see variant generation complete event
variant_generation_complete
  - event_label: "rag" (if RAG was used)
  - value: processing time in ms
```

### Test 4: RAG Failure Handling ✓

**Goal:** Verify graceful degradation when RAG fails

**Steps:**
1. Temporarily set invalid RAG URL: `RAG_API_URL=http://invalid.url`
2. Restart backend
3. Generate variants

**Expected:**
- ✅ Warning logged: "RAG query failed, proceeding with baseline only"
- ✅ Still generates 4 variants (all baseline)
- ✅ No RAG labels on variants
- ✅ User experience is not disrupted

**Restore:**
```bash
RAG_API_URL=http://100.103.129.72
```

### Test 5: Variant Selection & Analytics ✓

**Goal:** Verify variant selection tracking works

**Steps:**
1. Generate variants
2. Select a RAG-powered variant (click variant card)
3. Check analytics event

**Expected Backend Logs:**
```
[SessionsService] Variant selected
  - variantId: variant-XXX
  - generationSource: "rag"
  - ragWeight: 0.8
  - ragSourcesUsed: X
```

**Check DevTools Console:**
```javascript
variant_selected
  - event_label: variant label
  - value: RAG weight percentage
```

### Test 6: Performance Testing ✓

**Goal:** Verify generation completes within acceptable time

**Metrics to Track:**
- Total processing time: **Target <25s**
- RAG query time: **Target <2s**
- Individual variant time: **Target <8s each**

**Steps:**
1. Generate variants
2. Note the processing time shown in UI
3. Check backend logs for detailed timing

**Expected:**
- Total time < 25 seconds
- RAG query < 2 seconds
- If slower, may need to adjust RAG timeout or threshold

### Test 7: Different Categories ✓

**Goal:** Test RAG relevance across different topics

**Test Cases:**

| Category | Expected RAG Results |
|----------|---------------------|
| Leadership | High similarity (existing content) |
| Communication | High similarity (existing content) |
| Time Management | Medium similarity |
| Obscure Topic | Low/no results (fallback to baseline) |

**Steps:**
1. Test each category
2. Compare variant quality
3. Note similarity scores in logs

### Test 8: Outline Section Operations with RAG ✓

**Goal:** Verify section editing works with RAG-generated content

**Steps:**
1. Generate variants and select a RAG variant
2. In the preview panel, test:
   - ✅ Edit section title/description
   - ✅ Move section up/down
   - ✅ Duplicate section
   - ✅ Delete section
   - ✅ Add new section via "Quick Add"

**Expected:**
- All operations complete successfully
- Changes persist after reload
- No RAG-related errors

### Test 9: Gradual Rollout ✓

**Goal:** Verify rollout percentage works correctly

**Steps:**
1. Set `VARIANT_GENERATION_ROLLOUT_PERCENTAGE=50`
2. Restart backend
3. Generate variants multiple times with different session data

**Expected:**
- ~50% of requests use v2 (multi-variant)
- ~50% fall back to legacy (single variant)
- Decision is deterministic per session metadata

**Check Logs for Decision Reason:**
- `rollout_opt_in` = user got v2
- `rollout_filtered` = user filtered out

### Test 10: Knowledge Base Integration ✓

**Goal:** Verify RAG pulls from actual knowledge base

**Prerequisites:**
- Know what content exists in knowledge base
- Have test categories that match KB content

**Steps:**
1. Use category with known KB content
2. Generate variants
3. Review RAG-powered variant (weight 0.8)
4. Verify content references KB material

**Validation:**
- Sections mention KB topics
- Learning objectives align with KB
- Descriptions use KB terminology

## Troubleshooting

### Issue: RAG Service Not Responding

**Symptoms:**
```
[RagIntegrationService] RAG query failed after 3 attempt(s): network failure
```

**Solutions:**
1. Verify RAG service is running:
   ```bash
   curl http://100.103.129.72/health
   ```
2. Check network connectivity from backend server
3. Verify firewall allows traffic to port on RAG server
4. Check RAG_API_URL in environment variables

### Issue: Low Similarity Scores

**Symptoms:**
- RAG returns 0 results
- Similarity scores all below threshold (0.65)

**Solutions:**
1. Lower threshold temporarily:
   ```bash
   RAG_SIMILARITY_THRESHOLD=0.5
   ```
2. Check if category exists in knowledge base
3. Verify knowledge base is populated with content
4. Check RAG weighting configuration

### Issue: Slow Performance

**Symptoms:**
- Generation takes >30 seconds
- RAG queries timeout

**Solutions:**
1. Increase timeout:
   ```bash
   RAG_TIMEOUT_MS=15000
   ```
2. Reduce retry attempts:
   ```bash
   RAG_RETRY_ATTEMPTS=1
   ```
3. Increase similarity threshold (fewer results = faster):
   ```bash
   RAG_SIMILARITY_THRESHOLD=0.75
   ```
4. Check RAG service performance/logs

### Issue: Empty Variants

**Symptoms:**
- Variants generate but have no sections
- OpenAI errors in logs

**Solutions:**
1. Check OpenAI API key is valid
2. Verify OpenAI account has credits
3. Check OpenAI rate limits
4. Review error messages in logs

## Success Criteria

### Technical Success ✓
- [ ] RAG service accessible and responding
- [ ] All 4 variants generate successfully >95% of time
- [ ] RAG integration works with <5% error rate
- [ ] Average generation time <25 seconds
- [ ] RAG query time <2 seconds

### Quality Success ✓
- [ ] RAG variants show relevant content from knowledge base
- [ ] Similarity scores >0.65 for relevant categories
- [ ] Users can distinguish RAG vs baseline variants
- [ ] RAG-powered variants are selected >50% of the time

### Operational Success ✓
- [ ] Feature flags enable safe rollout
- [ ] Analytics track variant selections
- [ ] Logs provide debugging information
- [ ] Graceful degradation on RAG failure

## Next Steps After Testing

1. **Monitor in Production:**
   - Track RAG availability metrics
   - Monitor selection rates for RAG variants
   - Review user feedback

2. **Optimize if Needed:**
   - Adjust similarity threshold based on results
   - Tune RAG weighting parameters
   - Optimize timeout values

3. **Knowledge Base Improvements:**
   - Add more content for frequently requested categories
   - Improve content quality based on low similarity scores
   - Tag content with better metadata

4. **Feature Enhancements:**
   - Save RAG sources used for transparency
   - Show users which KB content was referenced
   - Allow users to provide feedback on variant quality

## API Endpoints for Testing

### Check RAG Metrics
```bash
# AI Interaction Metrics (includes RAG stats)
curl http://localhost:3001/api/analytics/ai-metrics

# Recent AI Events
curl http://localhost:3001/api/analytics/events?type=ai_content_generated&limit=10
```

### Test Variant Generation via API
```bash
curl -X POST http://localhost:3001/api/sessions/builder/suggest-outline-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Team Leadership Workshop",
    "category": "Leadership",
    "desiredOutcome": "Improve team communication",
    "sessionType": "workshop",
    "date": "2025-01-15",
    "startTime": "2025-01-15T18:00:00Z",
    "endTime": "2025-01-15T19:30:00Z"
  }'
```

## Reference Documentation

- **Environment Configuration:** `packages/backend/.env.example`
- **Operations Guide:** `docs-reference/MONITORING_AND_OPERATIONS.md`
- **API Documentation:** `docs-reference/tribeRAG-API_DOCUMENTATION.md`
- **Development Plan:** `implement-this-dev-plan.md`
