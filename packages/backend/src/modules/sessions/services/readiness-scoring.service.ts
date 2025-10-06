import { Injectable } from '@nestjs/common';
import { Session, SessionStatus } from '../../../entities';

export interface ReadinessCheck {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  weight: number;
  category: 'content' | 'metadata' | 'assignment' | 'integration';
}

export interface ReadinessScore {
  score: number;
  maxScore: number;
  percentage: number;
  checks: ReadinessCheck[];
  canPublish: boolean;
  recommendedActions: string[];
}

@Injectable()
export class ReadinessScoringService {
  private readonly PUBLISH_THRESHOLD = 0; // Minimum 0% readiness to publish (temporarily disabled for testing - TODO: Set back to 80% for production)

  async calculateReadinessScore(session: Session): Promise<ReadinessScore> {
    const checks = await this.performReadinessChecks(session);
    const totalScore = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
    const maxScore = checks.reduce((sum, check) => sum + check.weight, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    const recommendedActions = this.generateRecommendedActions(checks);

    return {
      score: totalScore,
      maxScore,
      percentage,
      checks,
      canPublish: percentage >= this.PUBLISH_THRESHOLD,
      recommendedActions,
    };
  }

  private async performReadinessChecks(session: Session): Promise<ReadinessCheck[]> {
    const checks: ReadinessCheck[] = [];

    // Core Metadata Checks (30 points total)
    checks.push({
      id: 'has-title',
      name: 'Session Title',
      description: 'Session has a descriptive title',
      passed: !!session.title && session.title.trim().length >= 3,
      weight: 10,
      category: 'metadata',
    });

    checks.push({
      id: 'has-objective',
      name: 'Learning Objective',
      description: 'Session has clear learning objectives',
      passed: !!session.objective && session.objective.trim().length >= 20,
      weight: 15,
      category: 'metadata',
    });

    checks.push({
      id: 'has-audience',
      name: 'Target Audience',
      description: 'Session defines target audience',
      passed: !!session.audience && session.audience.trim().length >= 3,
      weight: 5,
      category: 'metadata',
    });

    // Content Quality Checks (35 points total)
    const hasContentVersions = session.contentVersions && session.contentVersions.length > 0;
    checks.push({
      id: 'has-content-versions',
      name: 'Content Versions',
      description: 'Session has content versions (AI or manual)',
      passed: hasContentVersions,
      weight: 15,
      category: 'content',
    });

    const hasAgendaItems = session.agendaItems && session.agendaItems.length > 0;
    checks.push({
      id: 'has-agenda-items',
      name: 'Session Agenda',
      description: 'Session has structured agenda items',
      passed: hasAgendaItems,
      weight: 10,
      category: 'content',
    });

    const hasSufficientDuration = session.durationMinutes && session.durationMinutes >= 15;
    checks.push({
      id: 'sufficient-duration',
      name: 'Duration Set',
      description: 'Session duration is at least 15 minutes',
      passed: hasSufficientDuration,
      weight: 10,
      category: 'content',
    });

    // Assignment & Delivery Checks (20 points total)
    const hasTrainerAssigned = session.trainerAssignments && session.trainerAssignments.length > 0;
    checks.push({
      id: 'trainer-assigned',
      name: 'Trainer Assignment',
      description: 'Session has at least one trainer assigned',
      passed: hasTrainerAssigned,
      weight: 15,
      category: 'assignment',
    });

    const hasSchedule = !!session.scheduledAt;
    checks.push({
      id: 'scheduled',
      name: 'Scheduling',
      description: 'Session has a scheduled date/time',
      passed: hasSchedule,
      weight: 5,
      category: 'assignment',
    });

    // Integration & Landing Page Checks (15 points total)
    const hasLandingPage = !!session.landingPage;
    checks.push({
      id: 'landing-page',
      name: 'Landing Page',
      description: 'Session has associated landing page',
      passed: hasLandingPage,
      weight: 10,
      category: 'integration',
    });

    const hasIncentives = session.incentives && session.incentives.length > 0;
    checks.push({
      id: 'incentives-linked',
      name: 'Incentive Linkage',
      description: 'Session is linked to relevant incentives',
      passed: hasIncentives,
      weight: 5,
      category: 'integration',
    });

    return checks;
  }

  private generateRecommendedActions(checks: ReadinessCheck[]): string[] {
    const failedChecks = checks.filter(check => !check.passed);
    const actions: string[] = [];

    // Group by category and provide specific guidance
    const checksByCategory = failedChecks.reduce((groups, check) => {
      if (!groups[check.category]) groups[check.category] = [];
      groups[check.category].push(check);
      return groups;
    }, {} as Record<string, ReadinessCheck[]>);

    if (checksByCategory.metadata?.length) {
      actions.push('Complete session metadata: ' +
        checksByCategory.metadata.map(c => c.name.toLowerCase()).join(', '));
    }

    if (checksByCategory.content?.length) {
      actions.push('Develop session content: ' +
        checksByCategory.content.map(c => c.name.toLowerCase()).join(', '));
    }

    if (checksByCategory.assignment?.length) {
      actions.push('Assign delivery resources: ' +
        checksByCategory.assignment.map(c => c.name.toLowerCase()).join(', '));
    }

    if (checksByCategory.integration?.length) {
      actions.push('Set up session integrations: ' +
        checksByCategory.integration.map(c => c.name.toLowerCase()).join(', '));
    }

    if (actions.length === 0) {
      actions.push('Session is ready for publishing');
    }

    return actions;
  }

  getReadinessThreshold(): number {
    return this.PUBLISH_THRESHOLD;
  }

  async canPublish(session: Session): Promise<boolean> {
    const readiness = await this.calculateReadinessScore(session);
    return readiness.canPublish;
  }

  getChecklistForCategory(category: string): Partial<ReadinessCheck>[] {
    // Return empty checklist items for building UI forms
    const checklists = {
      metadata: [
        { id: 'has-title', name: 'Session Title', description: 'Add descriptive session title' },
        { id: 'has-objective', name: 'Learning Objective', description: 'Define clear learning outcomes' },
        { id: 'has-audience', name: 'Target Audience', description: 'Specify target audience' },
      ],
      content: [
        { id: 'has-content-versions', name: 'Content Versions', description: 'Generate or upload session content' },
        { id: 'has-agenda-items', name: 'Session Agenda', description: 'Create structured session timeline' },
        { id: 'sufficient-duration', name: 'Duration Set', description: 'Set appropriate session duration' },
      ],
      assignment: [
        { id: 'trainer-assigned', name: 'Trainer Assignment', description: 'Assign qualified trainer(s)' },
        { id: 'scheduled', name: 'Scheduling', description: 'Set date and time for delivery' },
      ],
      integration: [
        { id: 'landing-page', name: 'Landing Page', description: 'Create registration landing page' },
        { id: 'incentives-linked', name: 'Incentive Linkage', description: 'Link relevant incentives or rewards' },
      ],
    };

    return checklists[category] || [];
  }
}