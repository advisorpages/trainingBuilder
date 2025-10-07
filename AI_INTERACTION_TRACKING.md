# AI Interaction Tracking System

## Overview

A comprehensive system for tracking, monitoring, and analyzing all AI-generated content within the Training Builder application. This system captures every interaction with the OpenAI API, providing visibility into prompt effectiveness, data quality, costs, and user satisfaction.

## Features Implemented

### 1. Backend Infrastructure

#### Database Schema (`ai_interactions` table)
- **Interaction Metadata**: Type, status, timestamps
- **Prompt Data**: Rendered prompt with all variables, input data
- **AI Response**: Raw response, structured output
- **Performance Metrics**: Processing time, tokens used, estimated cost
- **Error Tracking**: Full error messages and stack traces
- **User Feedback**: Acceptance, rejection, quality scores
- **Data Quality**: Tracks missing variables and data completeness
- **Context**: Captures audience, tone, category, session type

#### API Endpoints (`/api/ai-interactions`)
```
GET    /ai-interactions              # List all with advanced filters
GET    /ai-interactions/metrics      # Aggregated analytics
GET    /ai-interactions/failures     # Recent failures
GET    /ai-interactions/data-quality-issues  # Incomplete requests
GET    /ai-interactions/export       # Export as JSON/CSV
GET    /ai-interactions/:id          # Single interaction details
POST   /ai-interactions/:id/feedback # Submit user feedback
```

#### Services
- **AIInteractionsService**: Full CRUD, filtering, metrics, export
- **OpenAIService**: Automatically logs every AI request/response

### 2. Frontend Dashboard

#### Admin > AI Insights Tab
Located at: `/admin-dashboard?tab=ai-insights`

**Four Main Views:**

1. **Metrics Dashboard**
   - Total interactions, success rate, avg processing time, total cost
   - Breakdown by interaction type
   - Status distribution
   - User feedback statistics
   - Data quality percentage
   - Average quality scores

2. **Interaction Log**
   - Searchable/filterable table of all interactions
   - Filters: date range, type, status, feedback, quality score
   - Columns: date, type, status, processing time, tokens, cost, feedback
   - Click to view full details

3. **Recent Failures**
   - Last 50 failed AI generations
   - Error messages and stack traces
   - Input data that caused failures

4. **Data Quality Issues**
   - Interactions with missing input variables
   - Shows which variables were missing
   - Helps identify form validation issues

#### Features
- **Advanced Filtering**: Date range, type, status, feedback, quality
- **Export**: Download interactions as CSV or JSON
- **Detail Modal**: View complete request/response data
- **Real-time Updates**: Metrics update as new interactions occur

### 3. Data Captured Per Interaction

Every AI generation automatically logs:
- ✅ Full rendered prompt (with variables replaced)
- ✅ All input variables (metadata, audience, tone, etc.)
- ✅ Raw AI response text
- ✅ Parsed structured output (JSON)
- ✅ Processing time (milliseconds)
- ✅ Tokens consumed
- ✅ Estimated cost (based on model pricing)
- ✅ Model used (gpt-4o-mini, etc.)
- ✅ Success/failure status
- ✅ Error messages & details (if failed)
- ✅ Missing variables detection
- ✅ Session context (audience ID, tone ID, category)
- ✅ Timestamp

## Usage

### For Admins

**View AI Performance:**
1. Navigate to Admin Dashboard
2. Click "AI Insights" tab (🔍 icon)
3. View metrics dashboard for overall health

**Debug Failed Generations:**
1. Go to "Recent Failures" tab
2. Click "View Details" on any failure
3. See full error message, input data, and context

**Check Data Quality:**
1. Go to "Data Quality Issues" tab
2. Review interactions with missing variables
3. Identify which form fields need validation

**Export Data for Analysis:**
1. Set date range filters
2. Click "Export CSV" or "Export JSON"
3. Analyze in Excel, R, Python, etc.

### For Developers

**Query Interactions Programmatically:**
```typescript
import { aiInteractionsService } from './services/ai-interactions.service';

// Get metrics
const metrics = await aiInteractionsService.getMetrics({
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});

// Get filtered interactions
const interactions = await aiInteractionsService.getAll({
  interactionType: AIInteractionType.OUTLINE_GENERATION,
  status: AIInteractionStatus.FAILURE,
  limit: 100
});

// Get data quality issues
const issues = await aiInteractionsService.getDataQualityIssues(50);
```

## Metrics Available

### Success Metrics
- **Success Rate**: % of successful generations
- **Failure Rate**: % of failed generations
- **Average Processing Time**: Mean response time
- **Total Cost**: Cumulative AI API costs

### Quality Metrics
- **Data Quality Rate**: % with all required variables
- **User Feedback Distribution**: Accepted/Rejected/Modified
- **Average Quality Score**: User-rated quality (0-100)

### Usage Metrics
- **By Type**: Outline, Title, Content, Training Kit, Marketing Kit
- **By Status**: Success, Failure, Partial
- **Total Tokens Used**: Cumulative token consumption

## Benefits

### 1. **Debugging & Troubleshooting**
- Instantly see why AI generations fail
- Access full context (input, prompt, error)
- No more digging through backend logs

### 2. **Prompt Optimization**
- Compare acceptance rates across prompt versions
- Identify which prompts produce best results
- A/B test prompt variations

### 3. **Data Quality Assurance**
- Detect missing or incomplete user inputs
- Ensure all required fields are captured
- Validate form data before AI generation

### 4. **Cost Monitoring**
- Track total AI API costs
- Identify expensive operations
- Budget and forecast AI expenses

### 5. **User Experience**
- Monitor processing times
- See which operations are slow
- Optimize for faster responses

### 6. **Quality Improvement**
- Collect user feedback on AI outputs
- Measure quality scores over time
- Identify patterns in rejections

## Database Schema

```sql
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY,
  session_id UUID,
  user_id UUID,
  prompt_id UUID,
  interaction_type ai_interaction_type_enum NOT NULL,
  status ai_interaction_status_enum NOT NULL,
  rendered_prompt TEXT NOT NULL,
  input_variables JSONB NOT NULL,
  ai_response TEXT,
  structured_output JSONB,
  error_message TEXT,
  error_details JSONB,
  processing_time_ms INT,
  tokens_used INT,
  estimated_cost DECIMAL(10,6),
  model_used VARCHAR(100),
  prompt_version VARCHAR(50),
  user_feedback user_feedback_enum DEFAULT 'no_feedback',
  user_feedback_comment TEXT,
  feedback_at TIMESTAMP,
  quality_score INT,
  edit_distance INT,
  metadata JSONB,
  audience_id INT,
  tone_id INT,
  category VARCHAR(100),
  session_type VARCHAR(50),
  all_variables_present BOOLEAN DEFAULT false,
  missing_variables JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Indexes for fast querying
CREATE INDEX idx_ai_interactions_session_created ON ai_interactions(session_id, created_at);
CREATE INDEX idx_ai_interactions_type_status ON ai_interactions(interaction_type, status);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at);
```

## Files Modified/Created

### Backend
- `src/entities/ai-interaction.entity.ts` - New entity
- `src/migrations/1738840000000-CreateAIInteractionsTable.ts` - Migration
- `src/services/ai-interactions.service.ts` - Business logic
- `src/services/openai.service.ts` - Auto-logging integration
- `src/modules/ai-interactions/ai-interactions.controller.ts` - API endpoints
- `src/modules/ai-interactions/ai-interactions.module.ts` - Module
- `src/modules/sessions/sessions.module.ts` - Updated imports
- `src/app.module.ts` - Registered new module
- `src/entities/index.ts` - Exported new entity

### Frontend
- `src/services/ai-interactions.service.ts` - API client
- `src/components/admin/AIInsightsTabContent.tsx` - Dashboard UI
- `src/pages/AdminDashboardPage.tsx` - Integrated new tab
- `src/layouts/AdminDashboardLayout.tsx` - Added navigation

## Future Enhancements

### Planned Features
1. **User Feedback UI in Session Builder**
   - Add 👍/👎 buttons after AI generations
   - Allow users to rate quality directly
   - Capture edit distance automatically

2. **Prompt Testing Playground**
   - Test prompts with sample data
   - Side-by-side comparison
   - Version history

3. **Advanced Analytics**
   - Charts and graphs
   - Time-series trends
   - Cost forecasting

4. **A/B Testing Framework**
   - Test multiple prompt versions
   - Automatic winner selection
   - Statistical significance testing

5. **Alerts & Notifications**
   - High failure rate alerts
   - Cost threshold warnings
   - Data quality degradation alerts

## Support

For questions or issues:
- Check `/api/ai-interactions` endpoint documentation
- Review error logs in AI Insights > Recent Failures
- Contact development team for assistance

---

**Last Updated**: January 2025
**Version**: 1.0.0
