import { describe, it, expect } from 'vitest';
import { aiTopicService } from '../../../services/aiTopicService';
import { TopicEnhancementInput, TopicAIContent } from '@leadership-training/shared';

describe('AI Topic Enhancement', () => {
  const mockEnhancementInput: TopicEnhancementInput = {
    name: 'Conflict Resolution',
    learningOutcome: 'Mediate workplace disputes effectively',
    categoryId: 1,
    audienceId: 1,
    toneId: 1,
    deliveryStyle: 'workshop',
    specialConsiderations: 'Include role-playing exercises',
  };

  const mockContext = {
    audienceId: 1,
    audienceName: 'New Managers',
    toneId: 1,
    toneName: 'Professional',
    categoryId: 1,
    categoryName: 'Leadership Development',
    deliveryStyle: 'workshop' as const,
    learningOutcome: 'Mediate workplace disputes effectively',
  };

  describe('Prompt Generation', () => {
    it('should build a comprehensive dual-purpose prompt', () => {
      const prompt = (aiTopicService as any).buildDualPurposePrompt(mockEnhancementInput, mockContext);

      expect(prompt).toContain('training content that serves two distinct audiences');
      expect(prompt).toContain('ATTENDEES');
      expect(prompt).toContain('TRAINERS');
      expect(prompt).toContain('Conflict Resolution');
      expect(prompt).toContain('New Managers');
      expect(prompt).toContain('Professional');
      expect(prompt).toContain('Leadership Development');
      expect(prompt).toContain('workshop');
      expect(prompt).toContain('role-playing exercises');
    });

    it('should include session context when available', () => {
      const inputWithSession = {
        ...mockEnhancementInput,
        sessionContext: {
          sessionTitle: 'Management Bootcamp',
          existingTopics: ['Team Building', 'Communication Skills'],
        }
      };

      const contextWithSession = {
        ...mockContext,
        sessionContext: {
          sessionTitle: 'Management Bootcamp',
          existingTopics: ['Team Building', 'Communication Skills'],
        }
      };

      const prompt = (aiTopicService as any).buildDualPurposePrompt(inputWithSession, contextWithSession);

      expect(prompt).toContain('Management Bootcamp');
      expect(prompt).toContain('Team Building, Communication Skills');
    });
  });

  describe('Content Extraction', () => {
    const mockAIContent: TopicAIContent = {
      enhancementContext: mockContext,
      enhancementMeta: {
        generatedAt: '2025-01-22T10:00:00Z',
        promptUsed: 'test-prompt',
        enhancementVersion: '1.0',
      },
      enhancedContent: {
        originalInput: {
          name: 'Conflict Resolution',
          description: 'Learn to resolve conflicts',
        },
        attendeeSection: {
          enhancedName: 'Practical Conflict Resolution for New Managers',
          whatYoullLearn: 'Master essential conflict resolution techniques',
          whoThisIsFor: 'New managers and team leaders',
          keyTakeaways: [
            'De-escalation strategies',
            'Mediation techniques',
            'Documentation best practices',
          ],
        },
        trainerSection: {
          deliveryFormat: 'Interactive workshop with role-playing',
          preparationGuidance: 'Review company HR policies',
          keyTeachingPoints: [
            'Active listening techniques',
            'Neutral facilitation methods',
            'Escalation procedures',
          ],
          recommendedActivities: [
            'Role-playing scenarios',
            'Case study analysis',
            'Practice sessions',
          ],
          materialsNeeded: [
            'Scenario cards',
            'Flip chart paper',
            'Reference handouts',
          ],
          commonChallenges: [
            'Participants taking sides',
            'Emotional responses',
          ],
          assessmentSuggestions: [
            'Peer debrief',
            'Action plan review',
          ],
        },
        enhancedDescription: 'Comprehensive dual-purpose description...',
        callToAction: 'Reserve your seat to practice conflict resolution skills with real scenarios.',
      },
    };

    it('should extract learning outcomes correctly', () => {
      const outcomes = aiTopicService.extractLearningOutcomes(mockAIContent);

      expect(outcomes).toContain('• De-escalation strategies');
      expect(outcomes).toContain('• Mediation techniques');
      expect(outcomes).toContain('• Documentation best practices');
    });

    it('should extract trainer notes correctly', () => {
      const trainerNotes = aiTopicService.extractTrainerNotes(mockAIContent);

      expect(trainerNotes).toContain('• Review company HR policies');
      expect(trainerNotes).toContain('• Role-playing scenarios');
      expect(trainerNotes).toContain('• Emphasize: Active listening techniques');
      expect(trainerNotes).toContain('• Watch for: Participants taking sides');
    });

    it('should extract materials needed correctly', () => {
      const materials = aiTopicService.extractMaterialsNeeded(mockAIContent);

      expect(materials).toContain('• Scenario cards');
      expect(materials).toContain('• Flip chart paper');
      expect(materials).toContain('• Reference handouts');
    });

    it('should extract delivery guidance correctly', () => {
      const guidance = aiTopicService.extractDeliveryGuidance(mockAIContent);

      expect(guidance).toContain('Interactive workshop with role-playing');
      expect(guidance).toContain('Assessment Suggestions:');
      expect(guidance).toContain('• Peer debrief');
      expect(guidance).toContain('Recommended Activities:');
      expect(guidance).toContain('• Role-playing scenarios');
      expect(guidance).toContain('• Case study analysis');
    });

    it('should extract call to action correctly', () => {
      const cta = aiTopicService.extractCallToAction(mockAIContent);
      expect(cta).toContain('Reserve your seat');
    });
  });

  describe('Response Validation', () => {
    it('should validate correct AI response format', () => {
      const validResponse = JSON.stringify({
        enhancedName: 'Test Topic',
        attendeeSection: {
          whatYoullLearn: 'Learn something',
          whoThisIsFor: 'Target audience',
          keyTakeaways: ['Takeaway 1', 'Takeaway 2'],
        },
        trainerSection: {
          deliveryFormat: 'Workshop format',
          preparationGuidance: 'Preparation notes',
          keyTeachingPoints: ['Point 1', 'Point 2'],
          recommendedActivities: ['Activity 1', 'Activity 2'],
          materialsNeeded: ['Material 1', 'Material 2'],
          commonChallenges: ['Challenge 1'],
          assessmentSuggestions: ['Assessment 1'],
        },
        enhancedDescription: 'Detailed description',
        callToAction: 'Sign up today',
      });

      const isValid = aiTopicService.validateAIResponse(validResponse);
      expect(isValid).toBe(true);
    });

    it('should reject invalid AI response format', () => {
      const invalidResponse = JSON.stringify({
        enhancedName: 'Test Topic',
        // Missing required attendeeSection and trainerSection
      });

      const isValid = aiTopicService.validateAIResponse(invalidResponse);
      expect(isValid).toBe(false);
    });

    it('should reject malformed JSON', () => {
      const malformedResponse = '{ invalid json }';

      const isValid = aiTopicService.validateAIResponse(malformedResponse);
      expect(isValid).toBe(false);
    });
  });

  describe('Session Context Building', () => {
    it('should build session context from session object', () => {
      const mockSession = {
        id: '123',
        title: 'Leadership Workshop',
        description: 'Comprehensive leadership training',
        topics: [
          { id: 1, name: 'Communication' },
          { id: 2, name: 'Team Building' },
        ],
      };

      const sessionContext = aiTopicService.buildSessionContext(mockSession);

      expect(sessionContext).toEqual({
        sessionTitle: 'Leadership Workshop',
        sessionDescription: 'Comprehensive leadership training',
        existingTopics: ['Communication', 'Team Building'],
      });
    });

    it('should handle session without topics', () => {
      const mockSession = {
        id: '123',
        title: 'New Session',
        description: 'Fresh session',
        topics: [],
      };

      const sessionContext = aiTopicService.buildSessionContext(mockSession);

      expect(sessionContext).toEqual({
        sessionTitle: 'New Session',
        sessionDescription: 'Fresh session',
        existingTopics: [],
      });
    });

    it('should return undefined for null session', () => {
      const sessionContext = aiTopicService.buildSessionContext(null);
      expect(sessionContext).toBeUndefined();
    });
  });
});
