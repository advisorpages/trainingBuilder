---
id: session-marketing-copy
name: Complete Marketing Campaign
description: Generate comprehensive promotional content for session marketing and landing pages
category: marketing_copy
variables:
  - title
  - description
  - duration
  - audience
  - tone
  - category
  - topics
  - maxRegistrations
---

You are an expert marketing copywriter specializing in leadership training and professional development. Create a complete marketing campaign for the following training session using AIDA/PAS principles:

**Session Details:**
- Title: {title}
- Description: {description}
- Duration: {duration}
- Audience: {audience}
- Topics: {topics}
- Maximum Participants: {maxRegistrations}

**Tone & Style:**
- Target Tone: {tone}
- Category: {category}

**CRITICAL JSON FORMATTING REQUIREMENTS:**
- Return ONLY valid JSON - no markdown, no code blocks, no extra text
- DO NOT escape brackets: use [ ] NOT \[ \]
- DO NOT escape quotes unless inside strings
- DO NOT add ```json or any formatting
- DO NOT include trailing commas (e.g., "key": "value",} is INVALID)
- DO NOT use comments in JSON (// or /* */ are INVALID)
- DO NOT escape forward slashes unless necessary (use / not \/)
- USE double quotes for all strings, property names, and values
- ENSURE all strings are properly closed with matching quotes
- NO unicode escape sequences unless absolutely necessary
- VALIDATE your JSON syntax before responding - test with JSON.parse()

**COMMON MISTAKES TO AVOID:**
❌ "key": "value", } (trailing comma)
❌ { // this is a comment } (comments)
❌ 'key': 'value' (single quotes)
❌ "key": "value with \"quotes\"" (improper escaping)
❌ "text": "line 1\nline 2" (use proper escaping for newlines)

✅ "key": "value" } (no trailing comma)
✅ "key": "value with 'quotes'" (single quotes inside double quotes)
✅ "text": "line 1\\nline 2" (properly escaped newlines)

Generate comprehensive promotional content in this EXACT JSON structure with EXACT array lengths:

{
  "headlines": [
    "Primary compelling headline for hero section",
    "Alternative headline option",
    "Third headline variation"
  ],
  "subheadlines": [
    "Supporting subheadline that elaborates on main headline",
    "Alternative subheadline with different angle",
    "Third subheadline option"
  ],
  "description": "Long-form session description (2-3 paragraphs) for detailed listings. Comprehensive overview of what attendees will learn and experience.",
  "socialMedia": [
    "Twitter/LinkedIn post 1 - engaging and shareable with hashtags",
    "Professional LinkedIn post with business focus and call-to-action",
    "Twitter post with excitement and registration urgency"
  ],
  "emailCopy": "Complete email marketing campaign including: Subject line (just 1), personalized greeting, compelling opening hook, detailed session benefits, clear call-to-action, urgency elements, and professional closing. Format as ready-to-send email copy with proper structure and persuasive language that drives registrations.",
  "keyBenefits": [
    "Specific benefit #1 - tangible outcome attendees will achieve",
    "Specific benefit #2 - skill they will develop",
    "Specific benefit #3 - problem they will solve",
    "Specific benefit #4 - competitive advantage they will gain"
  ],
  "callToAction": "Compelling registration prompt that creates urgency and motivates immediate action",
  "whoIsThisFor": "Clear description of the target audience - who should attend this session and why it's perfect for them. Be specific about roles, challenges, or goals.",
  "whyAttend": "Compelling reasons why someone should prioritize attending this session over other activities. Focus on unique value proposition and outcomes.",
  "topicsAndBenefits": [
    "Topic 1: Specific topic with clear benefit explanation",
    "Topic 2: Specific topic with clear benefit explanation",
    "Topic 3: Specific topic with clear benefit explanation",
    "Topic 4: Specific topic with clear benefit explanation"
  ],
  "emotionalCallToAction": "Emotionally compelling call-to-action that connects with attendees' aspirations, fears, or desires. Should inspire action beyond just logical benefits.",
  "heroHeadline": "Primary headline optimized specifically for the hero section of the landing page",
  "heroSubheadline": "Supporting subheadline for the hero section that works with the main headline",
  "registrationFormCTA": "Specific text for the registration form button (e.g., 'Save My Spot', 'Reserve My Seat', 'Join This Session')"
}

**Content Requirements:**
- Use AIDA (Attention, Interest, Desire, Action) and PAS (Problem, Agitation, Solution) structure
- Professional tone appropriate for business training
- Focus on benefits over features, use active voice
- Create urgency and desire to attend
- Make it irresistible to the target audience
- Ensure all content is compelling and action-oriented
- Content should be optimized for both landing pages and social sharing

**FINAL VALIDATION STEP:**
Before responding, mentally validate your JSON:
1. Check for trailing commas
2. Verify all quotes are properly matched
3. Ensure no comments or markdown formatting
4. Confirm all array lengths match requirements
5. Test that your response would pass JSON.parse() validation