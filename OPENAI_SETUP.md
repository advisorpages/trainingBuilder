# OpenAI Integration Setup Guide

## 🔑 **API Key Configuration**

To enable real AI content generation, you need to set up your OpenAI API key:

### 1. Get Your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-`)

### 2. Configure Environment Variables

The OpenAI configuration is now centralized in your backend `.env` file:

**`packages/backend/.env`:**
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2500
OPENAI_TEMPERATURE=0.7
OPENAI_TIMEOUT_MS=30000
OPENAI_MAX_RETRIES=3
```

**For Production Deployment:**
```bash
# Production Optimized Configuration
OPENAI_API_KEY=sk-your-production-api-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.6
OPENAI_TIMEOUT_MS=45000
OPENAI_MAX_RETRIES=5
```

**💡 Quick Setup:**
1. Copy your OpenAI API key
2. Edit `packages/backend/.env`
3. Replace the empty `OPENAI_API_KEY=` with your key
4. Restart the backend server

### 3. Verify Integration

The system will now:
- ✅ **With API key**: Use real OpenAI GPT-4o-mini for content generation
- ⚠️ **Without API key**: Fall back to template-based content (what you see now)

## 🔍 **Testing the Integration**

1. **Check Debug Panel**: The new debug panel (bottom right) shows:
   - API calls being made to `/sessions/builder/suggest-outline`
   - Whether OpenAI was used or template fallback
   - Request/response details

2. **Look for Status Indicators**: The AI Composer now shows:
   - 🟡 "Using Template Content" - No OpenAI key configured
   - 🟢 Real AI content generation - OpenAI working
   - 🔴 "AI Generation Failed" - API key issue or other error

## 🛠 **Backend Changes Made**

1. **New OpenAI Service** (`packages/backend/src/services/openai.service.ts`):
   - Handles GPT-4o-mini API calls
   - Structured JSON response parsing
   - Error handling and fallbacks

2. **Updated Sessions Service**:
   - Tries OpenAI first if configured
   - Falls back to template generation
   - Tracks generation source and timing

3. **Enhanced Frontend**:
   - Status indicators show generation source
   - Debug panel for API call monitoring
   - Better error handling and user feedback

## 💡 **Content Quality Differences**

**Template Content (Current)**:
- Generic sections: "Welcome & Context Setting", "Core Concepts & Stories"
- Based on simple string templating
- Same structure for all sessions

**OpenAI Content (With API Key)**:
- Customized sections based on your specific inputs
- Creative titles and engaging descriptions
- Tailored to your desired outcomes and topics
- Interactive elements and practical activities

## ⚙️ **Configuration Options**

### Model Settings
- **OPENAI_MODEL**: AI model to use (default: `gpt-4o-mini`)
  - `gpt-4o-mini`: Fast, cost-effective, good quality
  - `gpt-4o`: Higher quality, slower, more expensive
  - `gpt-4`: Legacy model, not recommended

- **OPENAI_MAX_TOKENS**: Maximum response length (default: `2500`)
  - Higher values = longer responses = higher costs
  - Recommended range: 1500-3000 for session outlines

- **OPENAI_TEMPERATURE**: Response creativity (default: `0.7`)
  - `0.0`: Very focused and deterministic
  - `0.7`: Balanced creativity and consistency
  - `1.0`: Maximum creativity and variation

### Request Settings
- **OPENAI_TIMEOUT_MS**: Request timeout in milliseconds (default: `30000`)
  - Increase for slower connections
  - Production recommended: 45000ms

- **OPENAI_MAX_RETRIES**: Number of retry attempts (default: `3`)
  - Automatic retry on server errors (500+)
  - Client errors (400-499) are not retried

- **OPENAI_BASE_URL**: API endpoint (default: `https://api.openai.com/v1`)
  - Change for custom deployments or proxy servers

## 🔧 **Troubleshooting**

### API Key Issues
- Make sure the key starts with `sk-`
- Check that you have OpenAI credits available
- Verify the key has the right permissions

### Debug Information
- Open the debug panel (bottom right button)
- Check API call logs for errors
- Look for HTTP status codes and error messages

### Environment Variables
- Restart the backend after adding the API key
- Check that your `.env` file is in the backend package root
- Verify the ConfigService is loading the environment properly

### Common Error Messages
- `OpenAI request timed out`: Increase `OPENAI_TIMEOUT_MS`
- `All X attempts failed`: Check your internet connection and API key
- `Invalid JSON response`: Model may be overloaded, try again
- `API returned 429`: Rate limit hit, wait or upgrade plan

## 💰 **Cost Considerations**

### Model Pricing (per 1M tokens)
- **gpt-4o-mini**: Input $0.15 / Output $0.60 (recommended)
- **gpt-4o**: Input $2.50 / Output $10.00
- **gpt-4**: Input $30.00 / Output $60.00

### Session Generation Costs
- **gpt-4o-mini**: ~$0.0008 per session outline (recommended)
- **gpt-4o**: ~$0.013 per session outline
- **gpt-4**: ~$0.15 per session outline

### Token Usage Per Session
- Input: ~300-500 tokens (your prompt)
- Output: ~800-1500 tokens (AI response)
- Total: ~1100-2000 tokens per generation

### Budget Estimates
- **100 sessions with gpt-4o-mini**: ~$0.08-0.16
- **100 sessions with gpt-4o**: ~$1.30-2.60
- **100 sessions with gpt-4**: ~$15-30

## 🚀 **Next Steps**

1. **Quick Setup**: Edit `packages/backend/.env` and add your OpenAI API key
2. **Restart Backend**: `npm run dev` in the backend package
3. **Test Generation**: Create a new session outline in the Session Builder
4. **Verify Integration**: Check the debug panel (bottom right) to confirm OpenAI usage
5. **Compare Quality**: Notice the difference between template and AI-generated content!

## 📁 **File Locations**

- **Configuration**: `packages/backend/.env` (all OpenAI settings)
- **Example Config**: `packages/backend/.env.example` (template with defaults)
- **Service Code**: `packages/backend/src/services/openai.service.ts`
- **Documentation**: `OPENAI_SETUP.md` (this file)