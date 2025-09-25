import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../../entities/topic.entity';

@Injectable()
export class TopicsEnhancementService {
  constructor(
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
  ) {}

  async findRelevantTopics(
    categoryId: string,
    keywords: string[] = [],
    limit = 10
  ): Promise<Topic[]> {
    const queryBuilder = this.topicsRepository.createQueryBuilder('topic');

    // Filter by category if provided
    if (categoryId && categoryId !== 'all') {
      // Note: This assumes topics have a category relationship
      // Adjust based on your actual Topic entity structure
      queryBuilder.leftJoin('topic.category', 'category');
      queryBuilder.where('category.id = :categoryId', { categoryId });
    }

    // Add keyword search if provided
    if (keywords.length > 0) {
      const keywordConditions = keywords.map((_, index) =>
        `topic.name ILIKE :keyword${index} OR topic.description ILIKE :keyword${index}`
      ).join(' OR ');

      queryBuilder.andWhere(`(${keywordConditions})`);

      // Add parameters for each keyword
      keywords.forEach((keyword, index) => {
        queryBuilder.setParameter(`keyword${index}`, `%${keyword}%`);
      });
    }

    queryBuilder
      .andWhere('topic.isActive = :isActive', { isActive: true })
      .orderBy('topic.name', 'ASC')
      .limit(limit);

    return await queryBuilder.getMany();
  }

  async findTopicsByCategory(categoryId: string): Promise<Topic[]> {
    if (!categoryId || categoryId === 'all') {
      return this.topicsRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
        take: 20
      });
    }

    // Adjust this query based on your actual relationship structure
    return this.topicsRepository
      .createQueryBuilder('topic')
      .leftJoin('topic.sessions', 'session')
      .leftJoin('session.category', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('topic.isActive = :isActive', { isActive: true })
      .orderBy('topic.name', 'ASC')
      .limit(20)
      .getMany();
  }

  async extractKeywordsFromText(text: string): Promise<string[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Simple keyword extraction - remove common words and extract meaningful terms
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'is', 'are', 'was', 'were', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'how', 'what', 'when', 'where', 'why', 'who'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  // Exercise-specific AI enhancement methods

  async enhanceTopicAsExercise(
    topicId: number,
    exerciseType: 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play' | 'presentation',
    context: {
      category: string;
      desiredOutcome?: string;
      audienceSize?: string;
      duration?: number;
    }
  ): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({
      where: { id: topicId, isActive: true }
    });

    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    // Generate exercise-specific AI content
    const exerciseContent = await this.generateExerciseContent(topic, exerciseType, context);

    // Update the topic with exercise properties
    await this.topicsRepository.update(topicId, {
      isExercise: true,
      exerciseType,
      exerciseInstructions: exerciseContent.instructions,
      estimatedDuration: context.duration || 30,
      aiGeneratedContent: exerciseContent.aiContent,
      learningOutcomes: exerciseContent.learningOutcomes,
      trainerNotes: exerciseContent.trainerNotes,
      deliveryGuidance: exerciseContent.deliveryGuidance
    });

    return this.topicsRepository.findOne({ where: { id: topicId } });
  }

  async createExerciseTopic(
    name: string,
    description: string,
    exerciseType: 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play' | 'presentation',
    context: {
      category: string;
      desiredOutcome?: string;
      audienceSize?: string;
      duration?: number;
    }
  ): Promise<Topic> {
    // Generate exercise-specific AI content
    const baseTopic = { name, description };
    const exerciseContent = await this.generateExerciseContent(baseTopic, exerciseType, context);

    // Create new exercise topic
    const exerciseTopic = this.topicsRepository.create({
      name,
      description,
      isExercise: true,
      exerciseType,
      exerciseInstructions: exerciseContent.instructions,
      estimatedDuration: context.duration || 30,
      aiGeneratedContent: exerciseContent.aiContent,
      learningOutcomes: exerciseContent.learningOutcomes,
      trainerNotes: exerciseContent.trainerNotes,
      materialsNeeded: exerciseContent.materialsNeeded,
      deliveryGuidance: exerciseContent.deliveryGuidance,
      isActive: true
    });

    return this.topicsRepository.save(exerciseTopic);
  }

  async findExerciseTopics(limit = 20): Promise<Topic[]> {
    return this.topicsRepository.find({
      where: {
        isExercise: true,
        isActive: true
      },
      order: { name: 'ASC' },
      take: limit
    });
  }

  async findExerciseTopicsByType(
    exerciseType: 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play' | 'presentation',
    limit = 10
  ): Promise<Topic[]> {
    return this.topicsRepository.find({
      where: {
        isExercise: true,
        exerciseType,
        isActive: true
      },
      order: { name: 'ASC' },
      take: limit
    });
  }

  private async generateExerciseContent(
    topic: { name: string; description?: string },
    exerciseType: string,
    context: { category: string; desiredOutcome?: string; audienceSize?: string; duration?: number }
  ): Promise<{
    instructions: string;
    learningOutcomes: string;
    trainerNotes: string;
    materialsNeeded: string;
    deliveryGuidance: string;
    aiContent: object;
  }> {
    // This is a simplified version - in production, this would call OpenAI API
    const duration = context.duration || 30;
    const category = context.category || 'Leadership';

    const instructions = this.generateExerciseInstructions(topic.name, exerciseType, category, duration);
    const learningOutcomes = this.generateExerciseLearningOutcomes(topic.name, category, context.desiredOutcome);
    const trainerNotes = this.generateExerciseTrainerNotes(topic.name, exerciseType, category);
    const materialsNeeded = this.generateExerciseMaterials(exerciseType, context.audienceSize);
    const deliveryGuidance = this.generateExerciseDeliveryGuidance(exerciseType, category);

    return {
      instructions,
      learningOutcomes,
      trainerNotes,
      materialsNeeded,
      deliveryGuidance,
      aiContent: {
        exerciseType,
        generatedAt: new Date(),
        context,
        enhanced: true
      }
    };
  }

  private generateExerciseInstructions(topicName: string, exerciseType: string, category: string, duration: number): string {
    const templates = {
      discussion: `${topicName} Discussion Exercise (${duration} minutes):
1. Opening question to frame the discussion (3 minutes)
2. Small group breakouts - discuss key aspects (${Math.floor(duration * 0.5)} minutes)
3. Large group sharing and synthesis (${Math.floor(duration * 0.3)} minutes)
4. Action planning and commitments (${Math.floor(duration * 0.2)} minutes)`,

      activity: `${topicName} Practice Activity (${duration} minutes):
1. Brief overview and instructions (5 minutes)
2. Individual practice or reflection (${Math.floor(duration * 0.4)} minutes)
3. Partner or small group sharing (${Math.floor(duration * 0.3)} minutes)
4. Large group debrief and insights (${Math.floor(duration * 0.3)} minutes)`,

      workshop: `${topicName} Workshop Exercise (${duration} minutes):
1. Problem/scenario introduction (5 minutes)
2. Team formation and role assignment (5 minutes)
3. Collaborative problem-solving work (${Math.floor(duration * 0.6)} minutes)
4. Team presentations and feedback (${Math.floor(duration * 0.25)} minutes)
5. Synthesis and key takeaways (5 minutes)`,

      'case-study': `${topicName} Case Study Analysis (${duration} minutes):
1. Case study presentation and reading time (${Math.floor(duration * 0.25)} minutes)
2. Individual analysis and question consideration (${Math.floor(duration * 0.25)} minutes)
3. Small group discussion and solution development (${Math.floor(duration * 0.35)} minutes)
4. Group presentations and expert feedback (${Math.floor(duration * 0.15)} minutes)`,

      'role-play': `${topicName} Role-Playing Exercise (${duration} minutes):
1. Scenario setup and role assignments (${Math.floor(duration * 0.2)} minutes)
2. Preparation time for participants (${Math.floor(duration * 0.15)} minutes)
3. Role-play execution (${Math.floor(duration * 0.45)} minutes)
4. Debrief discussion and learning extraction (${Math.floor(duration * 0.2)} minutes)`,

      presentation: `${topicName} Presentation Exercise (${duration} minutes):
1. Topic assignment and preparation time (${Math.floor(duration * 0.4)} minutes)
2. Mini-presentations by participants (${Math.floor(duration * 0.5)} minutes)
3. Q&A and feedback session (${Math.floor(duration * 0.1)} minutes)`
    };

    return templates[exerciseType as keyof typeof templates] || templates.activity;
  }

  private generateExerciseLearningOutcomes(topicName: string, category: string, desiredOutcome?: string): string {
    return `By completing this ${topicName} exercise, participants will:
- Apply ${category} concepts in practical scenarios
- Practice ${topicName} skills in a safe learning environment
- Receive feedback from peers and facilitators
- Build confidence in ${topicName} application
${desiredOutcome ? `- Make progress toward ${desiredOutcome.toLowerCase()}` : ''}
- Develop action plans for real-world implementation`;
  }

  private generateExerciseTrainerNotes(topicName: string, exerciseType: string, category: string): string {
    const baseNotes = `Facilitating the ${topicName} ${exerciseType}:
- Ensure clear instructions before beginning
- Monitor energy levels and adjust as needed
- Encourage full participation from all attendees
- Be prepared to provide guidance and coaching`;

    const typeSpecificNotes = {
      discussion: `
- Ask probing questions to deepen the conversation
- Help participants make connections between ideas
- Ensure all voices are heard in group discussions`,

      activity: `
- Provide examples if participants seem stuck
- Circulate to offer individual support as needed
- Keep the energy high and encourage experimentation`,

      workshop: `
- Ensure teams are balanced in experience and perspective
- Provide resources and materials as needed
- Help teams stay focused and on track`,

      'case-study': `
- Be prepared to answer questions about the case
- Help participants identify key decision points
- Connect case insights to real-world applications`,

      'role-play': `
- Create a safe space for experimentation
- Help participants stay in character appropriately
- Focus debrief on learning, not performance`,

      presentation: `
- Provide clear evaluation criteria
- Encourage constructive peer feedback
- Help nervous presenters build confidence`
    };

    return baseNotes + (typeSpecificNotes[exerciseType as keyof typeof typeSpecificNotes] || '');
  }

  private generateExerciseMaterials(exerciseType: string, audienceSize?: string): string {
    const baseMaterials = 'Flipchart paper, markers, sticky notes, timer';

    const typeSpecificMaterials = {
      discussion: 'Discussion guide handout, question prompts',
      activity: 'Worksheets, reflection templates, pens/pencils',
      workshop: 'Project materials, collaboration tools, presentation supplies',
      'case-study': 'Case study handouts, analysis frameworks, highlighters',
      'role-play': 'Role cards, scenario descriptions, name tags',
      presentation: 'Presentation templates, evaluation rubrics'
    };

    const materials = typeSpecificMaterials[exerciseType as keyof typeof typeSpecificMaterials] || 'Exercise handouts';
    return `${baseMaterials}, ${materials}`;
  }

  private generateExerciseDeliveryGuidance(exerciseType: string, category: string): string {
    return `Delivery guidance for ${category} ${exerciseType}:
1. Set clear expectations at the beginning
2. Create psychological safety for learning and experimentation
3. Provide structure while allowing flexibility
4. Use the debrief to reinforce key learning points
5. Connect the exercise back to real-world applications
6. Encourage participants to commit to specific actions
7. Follow up on learning and application in subsequent sessions`;
  }
}