import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Topic, Session, Audience, Tone, Category } from '../../entities';
import { CreateTopicDto } from './dto/create-topic.dto';
import { ImportTopicsDto, ImportTopicItemDto } from './dto/import-topics.dto';
import { recordsToCsv, CsvColumn } from '../../utils/csv.util';
import { TopicEnhancementRequestDto } from './dto/enhance-topic.dto';
import { TopicAIContent, TopicEnhancementResponse } from '@leadership-training/shared';
import { OpenAIService } from '../../services/openai.service';
import { AIInteractionType } from '../../entities/ai-interaction.entity';

interface TopicEnhancementContext {
  audienceId: number;
  audienceName: string;
  toneId: number;
  toneName: string;
  categoryId: number;
  categoryName: string;
  deliveryStyle: 'workshop' | 'presentation' | 'discussion';
  learningOutcome: string;
  specialConsiderations?: string;
  sessionContext?: {
    sessionTitle?: string;
    sessionDescription?: string;
    existingTopics: string[];
  };
}

interface NormalizedAttendeeSection {
  enhancedName: string;
  whatYoullLearn: string;
  whoThisIsFor: string;
  keyTakeaways: string[];
  prerequisites?: string;
}

interface NormalizedTrainerSection {
  deliveryFormat: string;
  preparationGuidance: string;
  keyTeachingPoints: string[];
  recommendedActivities: string[];
  materialsNeeded: string[];
  commonChallenges: string[];
  assessmentSuggestions: string[];
}

interface NormalizedTopicEnhancementData {
  attendeeSection: NormalizedAttendeeSection;
  trainerSection: NormalizedTrainerSection;
  enhancedDescription: string;
  callToAction: string;
}

export interface TopicExportRecord {
  id: number;
  name: string;
  description?: string | null;
  categoryId?: number | null;
  learningOutcomes?: string | null;
  trainerNotes?: string | null;
  materialsNeeded?: string | null;
  deliveryGuidance?: string | null;
  isActive: boolean;
  aiGeneratedContent?: unknown;
  createdAt: string | null;
  updatedAt: string | null;
  sessionIds: string[];
}

export interface UsageCheckResponse {
  inUse: boolean;
  sessionCount?: number;
}

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Audience)
    private readonly audienceRepository: Repository<Audience>,
    @InjectRepository(Tone)
    private readonly toneRepository: Repository<Tone>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly openAIService: OpenAIService,
  ) {}

  async findAll(): Promise<(Topic & { sessionCount: number })[]> {
    try {
      this.logger.log('Fetching all topics with session counts');

      // First, let's try a simple query to see if basic topic fetching works
      const simpleTopics = await this.topicRepository.find();
      this.logger.log(`Found ${simpleTopics.length} topics in database`);

      // Now try the complex query with session count
      const topics = await this.topicRepository
        .createQueryBuilder('topic')
        .leftJoinAndSelect('topic.category', 'category')
        .loadRelationCountAndMap('topic.sessionCount', 'topic.sessions')
        .orderBy('topic.name', 'ASC')
        .getMany();

      this.logger.log(`Successfully fetched ${topics.length} topics with session counts`);

      return topics.map((topic) => ({
        ...topic,
        sessionCount: (topic as Topic & { sessionCount?: number }).sessionCount ?? 0,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch topics:', error.message);
      this.logger.error('Error stack:', error.stack);

      // Try fallback - return topics without session counts
      try {
        this.logger.log('Attempting fallback: fetching topics without session counts');
        const fallbackTopics = await this.topicRepository.find();
        this.logger.log(`Fallback successful: found ${fallbackTopics.length} topics`);

        return fallbackTopics.map((topic) => ({
          ...topic,
          sessionCount: 0, // Default to 0 if we can't count sessions
        }));
      } catch (fallbackError) {
        this.logger.error('Fallback query also failed:', fallbackError.message);
        this.logger.error('Fallback error stack:', fallbackError.stack);
        throw fallbackError; // Re-throw the fallback error
      }
    }
  }

  async findOne(id: string): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['sessions', 'category']
    });

    if (!topic) {
      throw new NotFoundException(`Topic ${id} not found`);
    }

    return topic;
  }

  async create(dto: CreateTopicDto): Promise<Topic> {
    const topic = this.topicRepository.create({
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
      learningOutcomes: dto.learningOutcomes,
      trainerNotes: dto.trainerNotes,
      materialsNeeded: dto.materialsNeeded,
      deliveryGuidance: dto.deliveryGuidance,
      aiGeneratedContent: dto.aiGeneratedContent,
    });

    return this.topicRepository.save(topic);
  }

  async update(id: string, dto: Partial<CreateTopicDto>): Promise<Topic> {
    const topic = await this.findOne(id);

    if (dto.name !== undefined) topic.name = dto.name;
    if (dto.description !== undefined) topic.description = dto.description;
    if (dto.categoryId !== undefined) topic.categoryId = dto.categoryId;
    if (dto.learningOutcomes !== undefined) topic.learningOutcomes = dto.learningOutcomes;
    if (dto.trainerNotes !== undefined) topic.trainerNotes = dto.trainerNotes;
    if (dto.materialsNeeded !== undefined) topic.materialsNeeded = dto.materialsNeeded;
    if (dto.deliveryGuidance !== undefined) topic.deliveryGuidance = dto.deliveryGuidance;
    if (dto.aiGeneratedContent !== undefined) topic.aiGeneratedContent = dto.aiGeneratedContent;

    topic.updatedAt = new Date();

    return this.topicRepository.save(topic);
  }

  async enhanceTopic(dto: TopicEnhancementRequestDto): Promise<TopicEnhancementResponse> {
    const context = await this.buildEnhancementContext(dto);
    const systemPrompt = this.buildTopicEnhancementSystemPrompt();
    const userPrompt = this.buildTopicEnhancementPrompt(dto, context);
    const hasCurrentContent =
      !!dto.currentContent &&
      Object.values(dto.currentContent).some(
        (value) => typeof value === 'string' && value.trim().length > 0,
      );

    const requiredFields: Array<keyof TopicEnhancementRequestDto> = [
      'name',
      'learningOutcome',
      'categoryId',
      'audienceId',
      'toneId',
    ];

    const missingVariables = requiredFields.filter((field) => {
      const value = dto[field];
      if (typeof value === 'number') {
        return Number.isNaN(value) || value <= 0;
      }
      return !value || (typeof value === 'string' && value.trim().length === 0);
    });

    try {
      const completion = await this.openAIService.generateJsonCompletion({
        systemPrompt,
        userPrompt,
        interactionType: AIInteractionType.CONTENT_ENHANCEMENT,
        inputVariables: {
          name: dto.name,
          learningOutcome: dto.learningOutcome,
          categoryId: dto.categoryId,
          audienceId: dto.audienceId,
          toneId: dto.toneId,
          deliveryStyle: context.deliveryStyle,
          specialConsiderations: dto.specialConsiderations ?? null,
          sessionContext: context.sessionContext,
          currentContent: dto.currentContent ?? null,
        },
        category: context.categoryName,
        audienceId: context.audienceId,
        toneId: context.toneId,
        metadata: {
          enhancementContext: context,
          deliveryStyle: context.deliveryStyle,
          specialConsiderations: dto.specialConsiderations ?? null,
          currentContentProvided: hasCurrentContent,
        },
        allVariablesPresent: missingVariables.length === 0,
        missingVariables: missingVariables.length ? missingVariables : undefined,
      });

      const normalized = this.normalizeTopicEnhancementOutput(completion.content, dto, context);
      const aiContent = this.buildTopicAIContent(dto, context, normalized, userPrompt, completion.modelUsed);
      const enhancedTopic = this.buildEnhancedTopicFromAIContent(aiContent);

      return {
        enhancedTopic,
        aiContent,
        prompt: userPrompt,
      };
    } catch (error) {
      this.logger.error(
        'AI topic enhancement failed',
        error instanceof Error ? error.stack ?? error.message : String(error),
      );
      throw new BadRequestException('Unable to generate AI enhancement. Please try again later.');
    }
  }

  async remove(id: string): Promise<{ deleted: boolean; message?: string }> {
    const topic = await this.findOne(id);

    // Check if topic is used by any sessions
    const topicId = Number.parseInt(id, 10);
    const sessionCount = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoin('session.topics', 'topic')
      .where('topic.id = :topicId', { topicId })
      .getCount();

    if (sessionCount > 0) {
      return {
        deleted: false,
        message: `Cannot delete topic "${topic.name}" as it is used by ${sessionCount} session(s)`,
      };
    }

    await this.topicRepository.remove(topic);
    return { deleted: true };
  }

  private async buildEnhancementContext(dto: TopicEnhancementRequestDto): Promise<TopicEnhancementContext> {
    const [audience, tone, category] = await Promise.all([
      this.audienceRepository.findOne({ where: { id: dto.audienceId } }),
      this.toneRepository.findOne({ where: { id: dto.toneId } }),
      this.categoryRepository.findOne({ where: { id: dto.categoryId } }),
    ]);

    if (!audience) {
      throw new NotFoundException(`Audience ${dto.audienceId} not found`);
    }

    if (!tone) {
      throw new NotFoundException(`Tone ${dto.toneId} not found`);
    }

    if (!category) {
      throw new NotFoundException(`Category ${dto.categoryId} not found`);
    }

    const existingTopics = dto.sessionContext?.existingTopics?.filter(Boolean) ?? [];

    const sessionContext = dto.sessionContext
      ? {
          ...(dto.sessionContext.sessionTitle ? { sessionTitle: dto.sessionContext.sessionTitle } : {}),
          ...(dto.sessionContext.sessionDescription
            ? { sessionDescription: dto.sessionContext.sessionDescription }
            : {}),
          existingTopics,
        }
      : undefined;

    return {
      audienceId: audience.id,
      audienceName: audience.name,
      toneId: tone.id,
      toneName: tone.name,
      categoryId: category.id,
      categoryName: category.name,
      deliveryStyle: dto.deliveryStyle ?? 'workshop',
      learningOutcome: dto.learningOutcome,
      specialConsiderations: dto.specialConsiderations,
      sessionContext,
    };
  }

  private buildTopicEnhancementSystemPrompt(): string {
    return [
      'You are an expert instructional designer who creates practical, polished training content.',
      'Always respond with a single JSON object that matches the requested schema exactly.',
      'Do not include markdown, commentary, or additional text outside the JSON response.',
      'Use inclusive, motivating language and ensure trainer guidance is actionable.',
    ].join(' ');
  }

  private buildTopicEnhancementPrompt(
    dto: TopicEnhancementRequestDto,
    context: TopicEnhancementContext,
  ): string {
    const sessionDetails: string[] = [];

    if (context.sessionContext?.sessionTitle) {
      sessionDetails.push(`- Session Context: ${context.sessionContext.sessionTitle}`);
    }
    if (context.sessionContext?.sessionDescription) {
      sessionDetails.push(`- Session Description: ${context.sessionContext.sessionDescription}`);
    }
    if (context.sessionContext?.existingTopics?.length) {
      sessionDetails.push(`- Existing Topics: ${context.sessionContext.existingTopics.join(', ')}`);
    }
    if (context.specialConsiderations) {
      sessionDetails.push(`- Special Considerations: ${context.specialConsiderations}`);
    }

    const existingContentSections: string[] = [];
    const currentContent = dto.currentContent;

    if (currentContent?.description?.trim()) {
      existingContentSections.push(`Description:\n${currentContent.description.trim()}`);
    }
    if (currentContent?.learningOutcomes?.trim()) {
      existingContentSections.push(`Learning Outcomes:\n${currentContent.learningOutcomes.trim()}`);
    }
    if (currentContent?.trainerNotes?.trim()) {
      existingContentSections.push(`Trainer Tasks / Notes:\n${currentContent.trainerNotes.trim()}`);
    }
    if (currentContent?.materialsNeeded?.trim()) {
      existingContentSections.push(`Materials Needed:\n${currentContent.materialsNeeded.trim()}`);
    }
    if (currentContent?.deliveryGuidance?.trim()) {
      existingContentSections.push(`Delivery Guidance:\n${currentContent.deliveryGuidance.trim()}`);
    }

    const existingContentBlock = existingContentSections.length
      ? `\n## Existing Content To Refine:\n${existingContentSections.join('\n\n')}\n`
      : '';

    return `
Enhance the following training topic using the provided context.

## Current Topic Inputs
- Working Title: ${dto.name}
- Desired Learning Outcome: ${context.learningOutcome}
- Category: ${context.categoryName}
- Target Audience: ${context.audienceName}
- Tone: ${context.toneName}
- Delivery Style: ${context.deliveryStyle}${sessionDetails.length ? `\n${sessionDetails.join('\n')}` : ''}

## Task
Create polished, implementation-ready content for both attendees and trainers. Preserve the intent of any existing copy while improving clarity, flow, and impact. Retain bullet structures where present and prefer concise, action-oriented language.

If an existing section is provided, rewrite it rather than inventing new information. If a section is missing, create a compelling, practical version that best supports the stated learning outcome.${existingContentBlock}

Respond with JSON that matches this exact schema:
{
  "enhancedName": "string",
  "attendeeSection": {
    "whatYoullLearn": "string",
    "whoThisIsFor": "string",
    "keyTakeaways": ["string", "string", "string"],
    "prerequisites": "string"
  },
  "trainerSection": {
    "deliveryFormat": "string",
    "preparationGuidance": "string",
    "keyTeachingPoints": ["string", "string", "string"],
    "recommendedActivities": ["string", "string", "string"],
    "materialsNeeded": ["string", "string"],
    "commonChallenges": ["string", "string"],
    "assessmentSuggestions": ["string", "string"]
  },
  "enhancedDescription": "string",
  "callToAction": "string"
}

## Requirements
- Use plain, motivating language that reflects the ${context.toneName} tone for ${context.audienceName}.
- Provide 3-5 concise entries for each array with actionable, specific guidance.
- Keep the callToAction under 30 words and outcome-oriented.
- Ensure trainer guidance is specific, immediately usable, and references the delivery style.
- If prerequisites are minimal, state "No prior experience required".
- Do not include markdown, comments, or wrapper text—return only the JSON object.`;
  }

  private normalizeTopicEnhancementOutput(
    raw: unknown,
    dto: TopicEnhancementRequestDto,
    context: TopicEnhancementContext,
  ): NormalizedTopicEnhancementData {
    const root = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const attendeeRaw = (root.attendeeSection ??
      root.attendee ??
      {}) as Record<string, unknown>;
    const trainerRaw = (root.trainerSection ?? root.trainer ?? {}) as Record<string, unknown>;

    const attendee: NormalizedAttendeeSection = {
      enhancedName: this.sanitizeText(
        root.enhancedName ?? attendeeRaw.enhancedName ?? dto.name,
      ),
      whatYoullLearn: this.sanitizeText(
        attendeeRaw.whatYoullLearn ??
          attendeeRaw.what_youll_learn ??
          attendeeRaw.learningFocus ??
          attendeeRaw.learning_focus,
      ),
      whoThisIsFor: this.sanitizeText(
        attendeeRaw.whoThisIsFor ??
          attendeeRaw.who_this_is_for ??
          attendeeRaw.audience ??
          attendeeRaw.targetAudience ??
          attendeeRaw.target_audience,
      ),
      keyTakeaways: this.ensureArray(
        attendeeRaw.keyTakeaways ??
          attendeeRaw.key_takeaways ??
          attendeeRaw.takeaways ??
          attendeeRaw.attendeeTakeaways,
      ),
      prerequisites: this.sanitizeText(attendeeRaw.prerequisites),
    };

    if (!attendee.whatYoullLearn) {
      attendee.whatYoullLearn = dto.learningOutcome;
    }

    if (!attendee.whoThisIsFor) {
      attendee.whoThisIsFor = `Designed for ${context.audienceName} who want to ${dto.learningOutcome.toLowerCase()}.`;
    }

    if (!attendee.keyTakeaways.length) {
      attendee.keyTakeaways = [
        `Understand how to ${dto.learningOutcome.toLowerCase()}.`,
        `Apply strategies tailored for ${context.audienceName}.`,
        `Build confidence delivering in a ${context.deliveryStyle} format.`,
      ];
    }

    if (!attendee.prerequisites) {
      attendee.prerequisites = 'No prior experience required.';
    }

    const trainer: NormalizedTrainerSection = {
      deliveryFormat: this.sanitizeText(
        trainerRaw.deliveryFormat ?? trainerRaw.delivery_format ?? trainerRaw.format,
      ),
      preparationGuidance: this.sanitizeText(
        trainerRaw.preparationGuidance ??
          trainerRaw.preparation_guidance ??
          trainerRaw.preparation ??
          trainerRaw.prework,
      ),
      keyTeachingPoints: this.ensureArray(
        trainerRaw.keyTeachingPoints ??
          trainerRaw.key_teaching_points ??
          trainerRaw.teachingPoints ??
          trainerRaw.highlights,
      ),
      recommendedActivities: this.ensureArray(
        trainerRaw.recommendedActivities ??
          trainerRaw.recommended_activities ??
          trainerRaw.activities ??
          trainerRaw.facilitationIdeas,
      ),
      materialsNeeded: this.ensureArray(
        trainerRaw.materialsNeeded ?? trainerRaw.materials_needed ?? trainerRaw.materials,
      ),
      commonChallenges: this.ensureArray(
        trainerRaw.commonChallenges ??
          trainerRaw.common_challenges ??
          trainerRaw.pitfalls ??
          trainerRaw.watchouts,
      ),
      assessmentSuggestions: this.ensureArray(
        trainerRaw.assessmentSuggestions ??
          trainerRaw.assessment_suggestions ??
          trainerRaw.assessments ??
          trainerRaw.evaluationIdeas,
      ),
    };

    if (!trainer.deliveryFormat) {
      trainer.deliveryFormat = `Facilitate an interactive ${context.deliveryStyle} experience with frequent engagement checkpoints.`;
    }

    if (!trainer.preparationGuidance) {
      trainer.preparationGuidance =
        'Review attendee content, gather relevant case studies, and prepare materials before the session.';
    }

    if (!trainer.keyTeachingPoints.length) {
      trainer.keyTeachingPoints = [
        `Connect the learning outcome to real work scenarios for ${context.audienceName}.`,
        'Model the core technique step-by-step.',
        'Prompt reflections that tie insights to immediate actions.',
      ];
    }

    if (!trainer.recommendedActivities.length) {
      trainer.recommendedActivities = [
        `Lead a breakout activity where teams apply the concept to a current challenge.`,
        'Facilitate a role-play to practice the new approach.',
        'Run a quick write-and-share reflection to surface takeaways.',
      ];
    }

    if (!trainer.materialsNeeded.length) {
      trainer.materialsNeeded = [
        'Slides or visual aids summarizing key ideas',
        'Handouts or worksheets for breakout activities',
      ];
    }

    if (!trainer.commonChallenges.length) {
      trainer.commonChallenges = [
        'Participants default to old habits—plan quick demonstrations to reinforce the new approach.',
        'Limited participation—use deliberate prompts to invite quieter voices.',
      ];
    }

    if (!trainer.assessmentSuggestions.length) {
      trainer.assessmentSuggestions = [
        'Collect an exit ticket capturing one action the participant will take.',
        'Run a quick quiz or poll to gauge understanding of the core concept.',
      ];
    }

    let enhancedDescription = this.sanitizeText(
      root.enhancedDescription ?? root.description ?? root.summary,
    );

    if (!enhancedDescription) {
      enhancedDescription = `Explore "${attendee.enhancedName}" to equip ${context.audienceName.toLowerCase()} with the skills and confidence to ${dto.learningOutcome.toLowerCase()}.`;
    }

    let callToAction = this.sanitizeText(root.callToAction ?? root.cta);
    if (!callToAction) {
      callToAction = `Join this session to put ${dto.learningOutcome.toLowerCase()} into practice immediately.`;
    }

    return {
      attendeeSection: attendee,
      trainerSection: trainer,
      enhancedDescription,
      callToAction,
    };
  }

  private buildTopicAIContent(
    dto: TopicEnhancementRequestDto,
    context: TopicEnhancementContext,
    normalized: NormalizedTopicEnhancementData,
    prompt: string,
    modelUsed?: string,
  ): TopicAIContent {
    const generatedAt = new Date().toISOString();
    const sessionContext =
      context.sessionContext && context.sessionContext.sessionTitle
        ? {
            sessionTitle: context.sessionContext.sessionTitle,
            ...(context.sessionContext.sessionDescription
              ? { sessionDescription: context.sessionContext.sessionDescription }
              : {}),
            existingTopics: context.sessionContext.existingTopics,
          }
        : undefined;

    return {
      enhancementContext: {
        audienceId: context.audienceId,
        audienceName: context.audienceName,
        toneId: context.toneId,
        toneName: context.toneName,
        categoryId: context.categoryId,
        categoryName: context.categoryName,
        deliveryStyle: context.deliveryStyle,
        learningOutcome: context.learningOutcome,
        sessionContext,
      },
      enhancementMeta: {
        generatedAt,
        promptUsed: prompt,
        aiModel: modelUsed,
        enhancementVersion: '1.0.0',
      },
      enhancedContent: {
        originalInput: {
          name: dto.name,
          description: dto.currentContent?.description,
        },
        attendeeSection: {
          enhancedName: normalized.attendeeSection.enhancedName,
          whatYoullLearn: normalized.attendeeSection.whatYoullLearn,
          whoThisIsFor: normalized.attendeeSection.whoThisIsFor,
          keyTakeaways: normalized.attendeeSection.keyTakeaways,
          prerequisites: normalized.attendeeSection.prerequisites,
        },
        trainerSection: {
          deliveryFormat: normalized.trainerSection.deliveryFormat,
          preparationGuidance: normalized.trainerSection.preparationGuidance,
          keyTeachingPoints: normalized.trainerSection.keyTeachingPoints,
          recommendedActivities: normalized.trainerSection.recommendedActivities,
          materialsNeeded: normalized.trainerSection.materialsNeeded,
          timeAllocation: undefined,
          commonChallenges: normalized.trainerSection.commonChallenges,
          assessmentSuggestions: normalized.trainerSection.assessmentSuggestions,
        },
        enhancedDescription: normalized.enhancedDescription,
        callToAction: normalized.callToAction,
      },
    };
  }

  private buildEnhancedTopicFromAIContent(aiContent: TopicAIContent): TopicEnhancementResponse['enhancedTopic'] {
    const attendee = aiContent.enhancedContent.attendeeSection;
    const trainer = aiContent.enhancedContent.trainerSection;

    return {
      name: attendee.enhancedName,
      description: aiContent.enhancedContent.enhancedDescription,
      learningOutcomes: this.formatBulletList(attendee.keyTakeaways),
      trainerNotes: this.buildTrainerNotes(trainer),
      materialsNeeded: this.formatBulletList(trainer.materialsNeeded),
      deliveryGuidance: this.buildDeliveryGuidance(trainer),
      callToAction: aiContent.enhancedContent.callToAction,
    };
  }

  private formatBulletList(items: string[]): string {
    const formatted = items
      .map((item) => this.sanitizeText(item))
      .filter((item) => item.length > 0);

    return formatted.length ? formatted.map((item) => `• ${item}`).join('\n') : '';
  }

  private buildTrainerNotes(trainer: TopicAIContent['enhancedContent']['trainerSection']): string {
    const notes: string[] = [];

    if (trainer.preparationGuidance) {
      notes.push(trainer.preparationGuidance);
    }

    trainer.recommendedActivities.forEach((activity) => {
      if (activity) {
        notes.push(activity);
      }
    });

    trainer.keyTeachingPoints.forEach((point) => {
      if (point) {
        notes.push(`Emphasize: ${point}`);
      }
    });

    trainer.commonChallenges.forEach((challenge) => {
      if (challenge) {
        notes.push(`Watch for: ${challenge}`);
      }
    });

    return this.formatBulletList(notes);
  }

  private buildDeliveryGuidance(trainer: TopicAIContent['enhancedContent']['trainerSection']): string {
    const lines: string[] = [];

    if (trainer.deliveryFormat) {
      lines.push(trainer.deliveryFormat);
    }

    if (trainer.assessmentSuggestions.length) {
      lines.push('');
      lines.push('Assessment Suggestions:');
      trainer.assessmentSuggestions.forEach((suggestion) => {
        if (suggestion) {
          lines.push(`• ${suggestion}`);
        }
      });
    }

    if (trainer.recommendedActivities.length) {
      lines.push('');
      lines.push('Recommended Activities:');
      trainer.recommendedActivities.forEach((activity) => {
        if (activity) {
          lines.push(`• ${activity}`);
        }
      });
    }

    return lines.join('\n').trim();
  }

  private ensureArray(value: unknown): string[] {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeText(item)).filter((item) => item.length > 0);
    }

    if (typeof value === 'string') {
      return value
        .split(/\r?\n|[•-]+/g)
        .map((item) => this.sanitizeText(item))
        .filter((item) => item.length > 0);
    }

    return [this.sanitizeText(value)].filter((item) => item.length > 0);
  }

  private sanitizeText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    let text = String(value).replace(/\r?\n+/g, ' ').trim();
    text = text.replace(/^[\s•\-*\d.)(]+/, '').trim();
    return text;
  }

  private toIsoString(value: Date | string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  async exportAllDetailed(): Promise<TopicExportRecord[]> {
    const topics = await this.topicRepository.find({
      relations: ['sessions'],
      order: { name: 'ASC' },
    });

    return topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      categoryId: topic.categoryId,
      learningOutcomes: topic.learningOutcomes,
      trainerNotes: topic.trainerNotes,
      materialsNeeded: topic.materialsNeeded,
      deliveryGuidance: topic.deliveryGuidance,
      isActive: topic.isActive,
      aiGeneratedContent: topic.aiGeneratedContent,
      createdAt: this.toIsoString(topic.createdAt),
      updatedAt: this.toIsoString(topic.updatedAt),
      sessionIds: Array.isArray(topic.sessions) ? topic.sessions.map((session) => session.id) : [],
    }));
  }

  buildTopicsExportCsv(records: TopicExportRecord[]): string {
    const columns: CsvColumn[] = [
      { key: 'id' },
      { key: 'name' },
      { key: 'description' },
      { key: 'categoryId' },
      { key: 'learningOutcomes' },
      { key: 'trainerNotes' },
      { key: 'materialsNeeded' },
      { key: 'deliveryGuidance' },
      { key: 'isActive' },
      {
        key: 'aiGeneratedContent',
        header: 'aiGeneratedContent',
        transform: (value) => (value ? JSON.stringify(value) : ''),
      },
      { key: 'createdAt' },
      { key: 'updatedAt' },
      {
        key: 'sessionIds',
        header: 'sessionIds',
        transform: (value) => {
          if (!Array.isArray(value)) {
            return '';
          }
          if (value.length === 0) {
            return '';
          }
          return value.join(';');
        },
      },
    ];

    return recordsToCsv(
      records.map((record) => record as unknown as Record<string, unknown>),
      columns,
    );
  }

  async importTopics(payload: ImportTopicsDto) {
    const summary = {
      total: payload.topics.length,
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const topicDto of payload.topics) {
      try {
        const result = await this.upsertTopic(topicDto);
        if (result === 'created') {
          summary.created += 1;
        } else {
          summary.updated += 1;
        }
      } catch (error: any) {
        const message = error?.message ?? 'Unknown error';
        summary.errors.push(`${topicDto.name}: ${message}`);
        this.logger.error(`Failed to import topic "${topicDto.name}": ${message}`);
      }
    }

    return summary;
  }

  private async upsertTopic(_topicDto: ImportTopicItemDto): Promise<'created' | 'updated'> {
    let existing: Topic | null = null;

    if (_topicDto.id) {
      existing = await this.topicRepository.findOne({ where: { id: _topicDto.id } });
    }

    if (!existing) {
      existing = await this.topicRepository.findOne({
        where: { name: ILike(_topicDto.name) },
      });
    }

    if (existing) {
      existing.name = _topicDto.name;
      existing.description = _topicDto.description ?? existing.description ?? null;
      existing.categoryId = _topicDto.categoryId ?? existing.categoryId ?? null;
      existing.learningOutcomes = _topicDto.learningOutcomes ?? existing.learningOutcomes ?? null;
      existing.trainerNotes = _topicDto.trainerNotes ?? existing.trainerNotes ?? null;
      existing.materialsNeeded = _topicDto.materialsNeeded ?? existing.materialsNeeded ?? null;
      existing.deliveryGuidance = _topicDto.deliveryGuidance ?? existing.deliveryGuidance ?? null;
      existing.aiGeneratedContent = _topicDto.aiGeneratedContent ?? existing.aiGeneratedContent ?? null;
      if (typeof _topicDto.isActive === 'boolean') {
        existing.isActive = _topicDto.isActive;
      }

      existing.updatedAt = new Date();
      await this.topicRepository.save(existing);
      return 'updated';
    }

    const topic = this.topicRepository.create({
      name: _topicDto.name,
      description: _topicDto.description,
      categoryId: _topicDto.categoryId,
      learningOutcomes: _topicDto.learningOutcomes,
      trainerNotes: _topicDto.trainerNotes,
      materialsNeeded: _topicDto.materialsNeeded,
      deliveryGuidance: _topicDto.deliveryGuidance,
      isActive: typeof _topicDto.isActive === 'boolean' ? _topicDto.isActive : true,
      aiGeneratedContent: _topicDto.aiGeneratedContent,
    });

    await this.topicRepository.save(topic);
    return 'created';
  }

  async checkUsage(id: string): Promise<UsageCheckResponse> {
    const topic = await this.topicRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['sessions'],
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    const sessionCount = topic.sessions?.length || 0;
    return {
      inUse: sessionCount > 0,
      sessionCount,
    };
  }

  async polishTopic(id: string) {
    this.logger.log(`Polishing topic ${id}`);

    // Fetch the topic with its category
    const topic = await this.topicRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['category'],
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    // Build polish response comparing original vs AI-polished content
    const original = {
      name: topic.name,
      description: topic.description || '',
      learningOutcomes: topic.learningOutcomes || '',
      trainerNotes: topic.trainerNotes || '',
      materialsNeeded: topic.materialsNeeded || '',
      deliveryGuidance: topic.deliveryGuidance || '',
    };

    // Generate polished versions with AI-like enhancements
    const polished = {
      name: this.polishName(topic.name, topic.category?.name),
      description: this.polishDescription(topic.description, topic.name, topic.category?.name),
      learningOutcomes: this.polishLearningOutcomes(topic.learningOutcomes, topic.name),
      trainerNotes: this.polishTrainerNotes(topic.trainerNotes),
      materialsNeeded: this.polishMaterialsNeeded(topic.materialsNeeded),
      deliveryGuidance: this.polishDeliveryGuidance(topic.deliveryGuidance),
    };

    return {
      topicId: topic.id,
      original,
      polished,
      polishedAt: new Date().toISOString(),
    };
  }

  private polishName(name: string, categoryName?: string): string {
    if (!name) return '';

    // Make the name more engaging and specific
    let polished = name.trim();

    // If it's too short or generic, enhance it
    if (polished.length < 20 && categoryName) {
      // Add context from category if available
      if (!polished.toLowerCase().includes(categoryName.toLowerCase())) {
        polished = `${polished}: ${categoryName} Essentials`;
      }
    }

    // Capitalize properly
    return polished
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private polishDescription(description: string | null | undefined, topicName: string, categoryName?: string): string {
    if (!description || description.trim().length === 0) {
      // Generate a basic description if none exists
      const category = categoryName ? ` in ${categoryName}` : '';
      return `This comprehensive session on ${topicName}${category} provides participants with practical insights and actionable strategies. Through interactive learning and real-world applications, attendees will gain the knowledge and confidence to apply these concepts immediately in their work.`;
    }

    const trimmed = description.trim();

    // If description is too short, enhance it
    if (trimmed.length < 100) {
      return `${trimmed} Through this engaging session, participants will explore key concepts, practice essential skills, and develop actionable strategies that can be immediately applied in their professional context.`;
    }

    // Polish existing description - make it more engaging
    let polished = trimmed;

    // Ensure it starts with an action-oriented or benefit-focused sentence
    if (!polished.match(/^(This|In this|Discover|Learn|Explore|Master|Develop|Gain)/i)) {
      polished = `Discover how ${polished}`;
    }

    return polished;
  }

  private polishLearningOutcomes(outcomes: string | null | undefined, topicName: string): string {
    if (!outcomes || outcomes.trim().length === 0) {
      // Generate default learning outcomes
      return `• Understand the key principles and concepts of ${topicName}\n• Apply practical strategies in real-world scenarios\n• Develop confidence in implementing new approaches\n• Create an action plan for immediate application`;
    }

    const trimmed = outcomes.trim();

    // If it's not in bullet format, convert it
    if (!trimmed.includes('•') && !trimmed.includes('-') && !trimmed.includes('*')) {
      return `• ${trimmed}`;
    }

    // Polish existing outcomes - make them action-oriented
    return trimmed
      .split('\n')
      .map(line => {
        const cleaned = line.replace(/^[•\-*]\s*/, '').trim();
        if (!cleaned) return '';

        // Ensure each outcome starts with an action verb
        const actionVerbs = ['understand', 'apply', 'develop', 'create', 'analyze', 'demonstrate', 'implement', 'identify', 'evaluate'];
        const startsWithAction = actionVerbs.some(verb => cleaned.toLowerCase().startsWith(verb));

        if (!startsWithAction) {
          return `• Apply ${cleaned}`;
        }

        return `• ${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
      })
      .filter(Boolean)
      .join('\n');
  }

  private polishTrainerNotes(notes: string | null | undefined): string {
    if (!notes || notes.trim().length === 0) {
      // Generate default trainer notes
      return `• Review all materials and prep examples before session\n• Create a welcoming, inclusive environment for participation\n• Use real-world scenarios relevant to participants\n• Monitor engagement and adjust pacing as needed\n• Facilitate discussion rather than lecturing throughout\n• Encourage questions and peer-to-peer learning`;
    }

    const trimmed = notes.trim();

    // Convert to bullet format if needed
    if (!trimmed.includes('•') && !trimmed.includes('-') && !trimmed.includes('*')) {
      return `• ${trimmed}`;
    }

    // Polish existing notes - make them more actionable
    return trimmed
      .split('\n')
      .map(line => {
        const cleaned = line.replace(/^[•\-*]\s*/, '').trim();
        if (!cleaned) return '';

        // Ensure each note is action-oriented
        const trainerActionVerbs = ['prepare', 'review', 'create', 'facilitate', 'model', 'guide', 'demonstrate', 'lead', 'monitor', 'encourage', 'ask', 'share'];
        const startsWithAction = trainerActionVerbs.some(verb => cleaned.toLowerCase().startsWith(verb));

        if (!startsWithAction) {
          return `• Facilitate ${cleaned}`;
        }

        return `• ${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
      })
      .filter(Boolean)
      .join('\n');
  }

  private polishMaterialsNeeded(materials: string | null | undefined): string {
    if (!materials || materials.trim().length === 0) {
      // Generate default materials
      return `• Presentation slides or visual aids\n• Handouts or worksheets for activities\n• Flip chart and markers for group work\n• Timer for time-bound exercises\n• Participant materials (notebooks, pens)`;
    }

    const trimmed = materials.trim();

    // Convert to bullet format if needed
    if (!trimmed.includes('•') && !trimmed.includes('-') && !trimmed.includes('*')) {
      return `• ${trimmed}`;
    }

    // Polish existing materials list - make it clearer
    return trimmed
      .split('\n')
      .map(line => {
        const cleaned = line.replace(/^[•\-*]\s*/, '').trim();
        if (!cleaned) return '';

        return `• ${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
      })
      .filter(Boolean)
      .join('\n');
  }

  private polishDeliveryGuidance(guidance: string | null | undefined): string {
    if (!guidance || guidance.trim().length === 0) {
      // Generate default delivery guidance
      return `Start by creating psychological safety and setting clear expectations. Use the 70/30 rule: 30% presentation and 70% interactive application. Break content into digestible 10-15 minute segments with activities between each. Check for understanding frequently through questions and quick assessments. Adapt pace based on participant engagement and comprehension. End with clear next steps and action planning.`;
    }

    const trimmed = guidance.trim();

    // If it's in bullet format, convert to narrative
    if (trimmed.includes('•') || trimmed.includes('-') || trimmed.includes('*')) {
      const points = trimmed
        .split('\n')
        .map(line => line.replace(/^[•\-*]\s*/, '').trim())
        .filter(Boolean);

      return points.join('. ') + '.';
    }

    // Polish existing guidance - make it more structured
    let polished = trimmed;

    // Ensure it ends with a period
    if (!polished.endsWith('.')) {
      polished += '.';
    }

    // Add timing guidance if not present
    if (!polished.toLowerCase().includes('minute') && !polished.toLowerCase().includes('time')) {
      polished += ' Plan for 10-15 minute segments with interactive breaks between major concepts.';
    }

    return polished;
  }
}
