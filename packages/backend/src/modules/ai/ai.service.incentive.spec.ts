import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from './ai.service';

describe('AIService - Incentive Content Generation', () => {
  let service: AIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AIService],
    }).compile();

    service = module.get<AIService>(AIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateIncentiveContent', () => {
    it('should generate content for a valid incentive', async () => {
      const incentiveData = {
        title: 'Flash Sale - 50% Off Training',
        description: 'Limited time offer on leadership training courses',
        rules: 'Valid for 48 hours only',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-03'),
        audience: { name: 'managers' },
        tone: { name: 'urgent' },
        category: { name: 'training' }
      };

      const result = await service.generateIncentiveContent({ incentiveData });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.title).toBeDefined();
      expect(result.content.shortDescription).toBeDefined();
      expect(result.content.longDescription).toBeDefined();
      expect(result.content.rulesText).toBeDefined();
      expect(result.content.socialCopy).toBeDefined();
      expect(result.content.emailCopy).toBeDefined();
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.model).toBe('gpt-4');
      expect(result.totalTokensUsed).toBeGreaterThan(0);
    });

    it('should throw error for missing title', async () => {
      const incentiveData = {
        title: '',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-03')
      };

      await expect(service.generateIncentiveContent({ incentiveData }))
        .rejects.toThrow('Incentive title is required for content generation');
    });

    it('should throw error for missing dates', async () => {
      const incentiveData = {
        title: 'Test Incentive',
        startDate: undefined as any,
        endDate: new Date('2025-01-03')
      };

      await expect(service.generateIncentiveContent({ incentiveData }))
        .rejects.toThrow('Start and end dates are required for content generation');
    });

    it('should include urgency context for short-term incentives', async () => {
      const incentiveData = {
        title: 'Flash Sale',
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      };

      const result = await service.generateIncentiveContent({ incentiveData });

      expect(result.content.shortDescription).toContain('Don\'t wait');
      expect(result.content.socialCopy).toContain('🔥');
    });

    it('should customize content based on audience and tone', async () => {
      const incentiveData = {
        title: 'Professional Development Opportunity',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-07'),
        audience: { name: 'executives' },
        tone: { name: 'professional' },
        category: { name: 'leadership' }
      };

      const result = await service.generateIncentiveContent({ incentiveData });

      expect(result.content.longDescription).toContain('executives');
      expect(result.content.longDescription).toContain('leadership');
      expect(result.content.emailCopy).toContain('executives');
    });
  });

  describe('validateIncentiveDataForAI', () => {
    it('should return valid for complete incentive data', () => {
      const incentive = {
        title: 'Test Incentive',
        startDate: new Date(),
        endDate: new Date(),
      } as any;

      const result = service.validateIncentiveDataForAI(incentive);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('should return missing fields for incomplete data', () => {
      const incentive = {
        title: '',
        startDate: null,
        endDate: new Date(),
      } as any;

      const result = service.validateIncentiveDataForAI(incentive);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('title');
      expect(result.missingFields).toContain('startDate');
    });
  });
});