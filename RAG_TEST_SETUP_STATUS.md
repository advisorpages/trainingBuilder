# RAG Integration Test - Setup Status

## ✅ Completed Setup

### 1. RAG Service Discovery ✅
- **Service Location:** `http://100.103.129.72:8000`
- **Status:** Online and responding
- **API Documentation:** http://100.103.129.72:8000/docs
- **Endpoint:** `POST /search` ✅ (matches our code)

### 2. Configuration Updated ✅
Updated `/packages/backend/.env`:

```bash
# RAG Service
RAG_API_URL=http://100.103.129.72:8000 ✅
RAG_TIMEOUT_MS=10000 ✅
RAG_RETRY_ATTEMPTS=1 ✅
RAG_SIMILARITY_WEIGHT=0.5 ✅
RAG_RECENCY_WEIGHT=0.2 ✅
RAG_CATEGORY_WEIGHT=0.2 ✅
RAG_SIMILARITY_THRESHOLD=0.65 ✅

# Feature Flags
ENABLE_VARIANT_GENERATION_V2=true ✅
VARIANT_GENERATION_ROLLOUT_PERCENTAGE=100 ✅
LOG_VARIANT_SELECTIONS=true ✅
```

### 3. Code Verification ✅
- RAG integration service expects `/search` endpoint ✅
- Request format matches RAG API spec ✅
- Response handling matches RAG API response ✅

---

## ⚠️ REQUIRED: OpenAI API Key

**STATUS:** ❌ **MISSING - REQUIRED TO PROCEED**

The variant generation requires an OpenAI API key to function.

**Action Required:**
```bash
# Edit this file:
packages/backend/.env

# Update line 29:
OPENAI_API_KEY=your-actual-key-here

# Get your key from: https://platform.openai.com/api-keys
```

---

## 🚀 Next Steps (After Adding OpenAI Key)

### Option 1: Automated Start
```bash
./test-with-rag.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd packages/backend
npm run start:dev

# Terminal 2 - Frontend
cd packages/frontend
npm run dev

# Browser
open http://localhost:5173/sessions/builder/new
```

---

## 📋 Testing Checklist

Once services are running:

1. **Navigate to:** http://localhost:5173/sessions/builder/new

2. **Fill in form:**
   - Title: "Effective Leadership"
   - Category: "Leadership" (or any category in your KB)
   - Desired Outcome: "Improve team communication"
   - Session Type: "Workshop"
   - Select a location

3. **Click:** "Generate Variants"

4. **Expected Results:**
   - ✅ 4 variants appear (<25 seconds)
   - ✅ Some variants labeled "Knowledge Base-Driven"
   - ✅ Each variant shows sections and duration
   - ✅ No errors in console

5. **Check Backend Logs:**
   ```
   [SessionsService] Variant generation v2 request received
   [SessionsService] RAG query completed - resultsFound: X
   [SessionsService] Variant 1 generated (ragWeight: 0.8)
   ...
   [SessionsService] Multi-variant generation complete
   ```

6. **Test RAG Quality:**
   - Select a RAG-powered variant (high weight)
   - Verify content relates to your knowledge base
   - Compare to baseline variant (weight: 0.0)

---

## 🐛 Debugging

### If RAG Service Fails:
```bash
# Test RAG service directly:
curl -X POST http://100.103.129.72:8000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "leadership training",
    "filters": {"category": "Leadership"}
  }'
```

### If Backend Won't Start:
```bash
# Check for errors:
cd packages/backend
npm run start:dev

# Common issues:
# 1. Database not running (Docker)
# 2. Port 3001 already in use
# 3. Missing OpenAI key
```

### If Variants Don't Generate:
1. Check browser console for errors
2. Check backend logs for OpenAI errors
3. Verify OpenAI API key is valid
4. Check OpenAI account has credits

---

## 📊 Success Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| RAG Connectivity | 100% | Service responds to /search |
| Total Generation Time | <25s | Timer in UI |
| RAG Query Time | <2s | Backend logs |
| RAG Results Found | >0 | Backend logs (for relevant categories) |
| Variant Quality | User feedback | Compare RAG vs baseline variants |

---

## 🔧 Current Configuration Summary

```
Environment: Development
Backend Port: 3001
Frontend Port: 5173
Database: PostgreSQL on port 5433 (Docker)

RAG Service: http://100.103.129.72:8000 ✅
OpenAI Model: gpt-4o-mini
Feature Flag: v2 Enabled (100% rollout)

Session Builder v2: READY (pending OpenAI key)
```

---

## ⏭️ After Successful Testing

1. Document test results
2. Gather user feedback
3. Monitor performance metrics
4. Adjust RAG thresholds if needed
5. Plan gradual rollout (10% → 50% → 100%)

---

**Last Updated:** 2025-10-07
**Status:** ⚠️ Waiting for OpenAI API Key
