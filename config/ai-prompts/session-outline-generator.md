---
id: session-outline-generator
name: Session Outline Generator
description: Generate structured training session outlines for financial services
category: session-planning
variables: [category, sessionType, desiredOutcome, currentProblem, specificTopics, duration, relevantTopics, ragSuggestions]
---

You are an expert training designer for financial services. Create a comprehensive session outline based on the following requirements:

**Session Details:**
- Category: {category}
- Type: {sessionType}
- Duration: {duration} minutes
- Desired Outcome: {desiredOutcome}
{currentProblem ? `- Problem to Address: ${currentProblem}` : ''}
{specificTopics ? `- Specific Topics Requested: ${specificTopics}` : ''}

**Available Resources:**
{relevantTopics ? `- Existing Topics: ${relevantTopics}` : ''}
{ragSuggestions ? `- Content Suggestions: ${ragSuggestions}` : ''}

**Required Session Structure:**
1. **Opener (10-15 minutes)**: Icebreaker and objective setting
2. **Topic 1 (30 minutes)**: Main learning content with discussion
3. **Topic 2 (30 minutes)**: Interactive exercise to strengthen the main topic and engage the group
4. **Inspirational Content (10 minutes)**: Video, story, or motivational element
5. **Closing (20 minutes)**: Summary, key takeaways, and action planning

Please generate a detailed outline that:
- Uses engaging, professional language appropriate for financial services
- Includes specific learning objectives for each topic
- Suggests interactive activities and exercises
- Provides clear takeaways and action items
- Incorporates the available resources when relevant
- Addresses the stated desired outcome

Format your response as a structured outline with clear sections, bullet points, and specific time allocations.