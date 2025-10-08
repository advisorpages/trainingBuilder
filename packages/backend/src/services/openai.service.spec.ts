import { OpenAIService } from './openai.service';
import { AIInteractionStatus } from '../entities/ai-interaction.entity';

describe('OpenAIService - outline validation', () => {
  const originalFetch = global.fetch;

  const buildConfigService = () => {
    const values: Record<string, string> = {
      OPENAI_API_KEY: 'test-key',
      OPENAI_BASE_URL: 'https://openai.test/v1',
      OPENAI_MODEL: 'gpt-test',
      OPENAI_MAX_TOKENS: '512',
      OPENAI_TEMPERATURE: '0.2',
      OPENAI_TIMEOUT_MS: '1000',
      OPENAI_MAX_RETRIES: '1',
    };

    return {
      get: jest.fn((key: string, fallback?: unknown) => {
        const value = values[key];
        return value !== undefined ? value : fallback;
      }),
    };
  };

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    }
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('throws when OpenAI returns an outline missing required sections', async () => {
    const configService = buildConfigService();
    const createMock = jest.fn().mockResolvedValue(undefined);
    const aiInteractionsService = { create: createMock };

    const service = new OpenAIService(
      configService as any,
      aiInteractionsService as any,
    );

    const malformedOutline = JSON.stringify({
      suggestedTitle: 'Test Session',
      summary: 'Summary',
      sections: [],
      totalDuration: 90,
      difficulty: 'Intermediate',
      recommendedAudienceSize: '8-12',
    });

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: malformedOutline,
            },
          },
        ],
        usage: {
          total_tokens: 100,
        },
      }),
    });

    global.fetch = fetchMock as any;

    await expect(
      service.generateSessionOutline({
        category: 'Leadership',
        sessionType: 'workshop',
        desiredOutcome: 'Improve coaching conversations',
        duration: 90,
      }),
    ).rejects.toThrow('OpenAI outline validation failed: Outline is missing sections');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AIInteractionStatus.FAILURE,
        errorMessage: 'OpenAI outline validation failed: Outline is missing sections',
        errorDetails: expect.objectContaining({
          name: 'OpenAIOutlineValidationError',
        }),
      }),
    );
  });

  it('normalizes outline total duration when sections sum matches requested duration', async () => {
    const configService = buildConfigService();
    const createMock = jest.fn().mockResolvedValue(undefined);
    const aiInteractionsService = { create: createMock };

    const service = new OpenAIService(
      configService as any,
      aiInteractionsService as any,
    );

    const outline = {
      suggestedTitle: 'Balanced Session',
      summary: 'A well-structured session',
      sections: [
        { title: 'Introduction', duration: 20, description: 'Kick off the workshop' },
        { title: 'Core Practice', duration: 60, description: 'Hands-on activities' },
        { title: 'Commitments', duration: 20, description: 'Wrap-up and next steps' },
      ],
      totalDuration: 150,
      difficulty: 'Intermediate',
      recommendedAudienceSize: '8-12',
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(outline),
            },
          },
        ],
        usage: {
          total_tokens: 100,
        },
      }),
    });

    global.fetch = fetchMock as any;

    const result = await service.generateSessionOutline({
      category: 'Leadership',
      sessionType: 'workshop',
      desiredOutcome: 'Improve coaching conversations',
      duration: 100,
    });

    expect(result.totalDuration).toBe(100);
    expect(result.sections.reduce((sum, section) => sum + section.duration, 0)).toBe(100);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AIInteractionStatus.SUCCESS,
      }),
    );
  });

  it('throws when outline durations cannot be normalized within tolerance', async () => {
    const configService = buildConfigService();
    const createMock = jest.fn().mockResolvedValue(undefined);
    const aiInteractionsService = { create: createMock };

    const service = new OpenAIService(
      configService as any,
      aiInteractionsService as any,
    );

    const outline = {
      suggestedTitle: 'Skewed Session',
      summary: 'An imbalanced session',
      sections: [
        { title: 'Introduction', duration: 15, description: 'Welcome' },
        { title: 'Lecture', duration: 30, description: 'Content delivery' },
        { title: 'Wrap-up', duration: 15, description: 'Closing' },
      ],
      totalDuration: 240,
      difficulty: 'Intermediate',
      recommendedAudienceSize: '8-12',
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(outline),
            },
          },
        ],
        usage: {
          total_tokens: 100,
        },
      }),
    });

    global.fetch = fetchMock as any;

    await expect(
      service.generateSessionOutline({
        category: 'Leadership',
        sessionType: 'workshop',
        desiredOutcome: 'Improve coaching conversations',
        duration: 120,
      }),
    ).rejects.toThrow('OpenAI outline validation failed: Outline section durations do not align with totalDuration');

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AIInteractionStatus.FAILURE,
        errorMessage: 'OpenAI outline validation failed: Outline section durations do not align with totalDuration',
        errorDetails: expect.objectContaining({
          name: 'OpenAIOutlineValidationError',
        }),
      }),
    );
  });
});
