import axios from 'axios';
import { TopicEnhancementInput, TopicAIContent, TopicEnhancementResponse, Audience, Tone, Category } from '@leadership-training/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface TopicEnhancementContext {
  audienceId: number;
  audienceName: string;
  toneId: number;
  toneName: string;
  categoryId: number;
  categoryName: string;
  deliveryStyle: 'workshop' | 'presentation' | 'discussion';
  learningOutcome: string;
  sessionContext?: {
    sessionTitle?: string;
    sessionDescription?: string;
    existingTopics?: string[];
  };
}

class AITopicService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate AI enhancement for a topic
   */
  async enhanceTopic(input: TopicEnhancementInput): Promise<TopicEnhancementResponse> {
    try {
      const response = await this.api.post('/topics/enhance', input);
      return response.data;
    } catch (error) {
      console.error('Error enhancing topic:', error);
      throw error;
    }
  }

  /**
   * Generate AI prompt for manual enhancement (ChatGPT workflow)
   */
  async generatePrompt(input: TopicEnhancementInput): Promise<string> {
    try {
      // First, get the context details (audience, tone, category names)
      const context = await this.buildEnhancementContext(input);

      // Generate the dual-purpose prompt
      const prompt = this.buildDualPurposePrompt(input, context);

      return prompt;
    } catch (error) {
      console.error('Error generating prompt:', error);
      throw error;
    }
  }

  /**
   * Parse AI response from manual enhancement
   */
  async parseAIResponse(input: TopicEnhancementInput, aiResponse: string): Promise<TopicEnhancementResponse> {
    try {
      const response = await this.api.post('/topics/parse-ai-response', {
        input,
        aiResponse
      });
      return response.data;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw error;
    }
  }

  /**
   * Re-enhance existing topic with new context
   */
  async reEnhanceForContext(
    topicId: number,
    newContext: Partial<TopicEnhancementInput>
  ): Promise<TopicEnhancementResponse> {
    try {
      const response = await this.api.put(`/topics/${topicId}/re-enhance`, newContext);
      return response.data;
    } catch (error) {
      console.error('Error re-enhancing topic:', error);
      throw error;
    }
  }

  /**
   * Build enhancement context by fetching audience, tone, category details
   */
  private async buildEnhancementContext(input: TopicEnhancementInput): Promise<TopicEnhancementContext> {
    try {
      // Fetch audience, tone, and category details in parallel
      const [audienceResponse, toneResponse, categoryResponse] = await Promise.all([
        this.api.get(`/audiences/${input.audienceId}`),
        this.api.get(`/tones/${input.toneId}`),
        this.api.get(`/categories/${input.categoryId}`)
      ]);

      const audience: Audience = audienceResponse.data;
      const tone: Tone = toneResponse.data;
      const category: Category = categoryResponse.data;

      return {
        audienceId: input.audienceId,
        audienceName: audience.name,
        toneId: input.toneId,
        toneName: tone.name,
        categoryId: input.categoryId,
        categoryName: category.name,
        deliveryStyle: input.deliveryStyle || 'workshop',
        learningOutcome: input.learningOutcome,
        sessionContext: input.sessionContext
      };
    } catch (error) {
      console.error('Error building enhancement context:', error);
      throw error;
    }
  }

  /**
   * Build dual-purpose AI prompt template
   */
  private buildDualPurposePrompt(input: TopicEnhancementInput, context: TopicEnhancementContext): string {
    const sessionContextText = context.sessionContext?.sessionTitle
      ? `\n- Session Context: "${context.sessionContext.sessionTitle}"${context.sessionContext.existingTopics?.length ? `\n- Existing Topics: ${context.sessionContext.existingTopics.join(', ')}` : ''}`
      : '';

    const specialConsiderationsText = input.specialConsiderations
      ? `\n- Special Considerations: ${input.specialConsiderations}`
      : '';

    return `You are creating training content that serves two distinct audiences:

1. ATTENDEES: Need clear, engaging descriptions of what they'll learn and achieve
2. TRAINERS: Need specific guidance on how to deliver, prepare, and facilitate effectively

## Context Information:
- Topic Name: "${input.name}"
- Learning Outcome: "${input.learningOutcome}"
- Target Audience: ${context.audienceName}
- Communication Tone: ${context.toneName}
- Content Category: ${context.categoryName}
- Delivery Style: ${context.deliveryStyle}${sessionContextText}${specialConsiderationsText}

## Your Task:
Generate comprehensive topic content that includes:

### For Attendees:
- An enhanced, compelling topic name that clearly indicates the value for ${context.audienceName}
- Clear explanation of what participants will learn and be able to DO after this topic
- Who this topic is specifically designed for (prerequisites, experience level)
- Key takeaways and benefits (3-5 bullet points)

### For Trainers:
- Recommended delivery format and approach for ${context.deliveryStyle} style
- Specific preparation guidance (what trainers need to review/prepare beforehand)
- Key teaching points to emphasize during delivery
- Recommended activities, exercises, or interactions (3-5 specific suggestions)
- Materials and resources needed
- Common challenges trainers might face and how to address them
- Assessment or evaluation suggestions to measure learning

## Output Format:
Please structure your response as a JSON object with this exact format:

\`\`\`json
{
  "enhancedName": "Enhanced topic name here",
  "attendeeSection": {
    "whatYoullLearn": "Clear description of learning outcomes",
    "whoThisIsFor": "Target audience and prerequisites",
    "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
    "prerequisites": "Any required background knowledge"
  },
  "trainerSection": {
    "deliveryFormat": "Recommended teaching approach",
    "preparationGuidance": "What trainers need to prepare",
    "keyTeachingPoints": ["Point 1", "Point 2", "Point 3"],
    "recommendedActivities": ["Activity 1", "Activity 2", "Activity 3"],
    "materialsNeeded": ["Material 1", "Material 2"],
    "commonChallenges": ["Challenge 1", "Challenge 2"],
    "assessmentSuggestions": ["Assessment 1", "Assessment 2"]
  }
}
\`\`\`

## Important Guidelines:
- Use ${context.toneName} tone throughout
- Ensure content is appropriate for ${context.audienceName}
- Make trainer guidance specific and actionable
- Focus on practical application and real-world relevance
- Ensure learning outcomes are measurable and achievable`;
  }

  /**
   * Auto-detect session context for topic enhancement
   */
  buildSessionContext(session: any): TopicEnhancementInput['sessionContext'] {
    if (!session) return undefined;

    return {
      sessionTitle: session.title,
      sessionDescription: session.description,
      existingTopics: session.topics?.map((topic: any) => topic.name) || []
    };
  }

  /**
   * Validate AI response format
   */
  validateAIResponse(response: string): boolean {
    try {
      const parsed = JSON.parse(response);

      // Check required fields
      const required = [
        'enhancedName',
        'attendeeSection.whatYoullLearn',
        'attendeeSection.whoThisIsFor',
        'attendeeSection.keyTakeaways',
        'trainerSection.deliveryFormat',
        'trainerSection.preparationGuidance',
        'trainerSection.keyTeachingPoints',
        'trainerSection.recommendedActivities',
        'trainerSection.materialsNeeded'
      ];

      for (const field of required) {
        const keys = field.split('.');
        let obj = parsed;
        for (const key of keys) {
          if (!obj || !obj[key]) {
            console.warn(`Missing required field: ${field}`);
            return false;
          }
          obj = obj[key];
        }
      }

      return true;
    } catch (error) {
      console.error('Invalid JSON response:', error);
      return false;
    }
  }

  /**
   * Extract learning outcomes from enhanced content
   */
  extractLearningOutcomes(aiContent: TopicAIContent): string {
    const takeaways = aiContent.enhancedContent.attendeeSection.keyTakeaways;
    return takeaways.map(takeaway => `• ${takeaway}`).join('\n');
  }

  /**
   * Extract trainer notes from enhanced content
   */
  extractTrainerNotes(aiContent: TopicAIContent): string {
    const trainerSection = aiContent.enhancedContent.trainerSection;
    return `${trainerSection.preparationGuidance}\n\nKey Teaching Points:\n${trainerSection.keyTeachingPoints.map(point => `• ${point}`).join('\n')}`;
  }

  /**
   * Extract materials needed from enhanced content
   */
  extractMaterialsNeeded(aiContent: TopicAIContent): string {
    return aiContent.enhancedContent.trainerSection.materialsNeeded.join('\n• ');
  }

  /**
   * Extract delivery guidance from enhanced content
   */
  extractDeliveryGuidance(aiContent: TopicAIContent): string {
    const trainerSection = aiContent.enhancedContent.trainerSection;
    return `${trainerSection.deliveryFormat}\n\nRecommended Activities:\n${trainerSection.recommendedActivities.map(activity => `• ${activity}`).join('\n')}`;
  }
}

export const aiTopicService = new AITopicService();
export default aiTopicService;