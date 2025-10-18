import { Injectable } from '@nestjs/common';
import { Session } from '../../../entities';

export interface ReadinessCheck {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  weight: number;
  category: 'assignment';
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
  private readonly PUBLISH_THRESHOLD = 100; // Minimum 100% readiness to publish (all items required)

  async calculateReadinessScore(session: Session): Promise<ReadinessScore> {
    const checks = await this.performReadinessChecks(session);
    const totalScore = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
    const maxScore = checks.reduce((sum, check) => sum + check.weight, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

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

    // Check 1: All topics have trainers assigned (40 points)
    const sessionTopics = session.sessionTopics ?? [];
    const allTopicsHaveTrainers = sessionTopics.length > 0 &&
      sessionTopics.every(
        (sessionTopic) => sessionTopic.trainerId !== undefined && sessionTopic.trainerId !== null,
      );

    checks.push({
      id: 'all-topics-trainers-assigned',
      name: 'Trainer Assignment',
      description: 'All topics in the session have trainers assigned',
      passed: allTopicsHaveTrainers,
      weight: 40,
      category: 'assignment',
    });

    // Check 2: Session has scheduled date and time (35 points)
    const hasSchedule = !!session.scheduledAt;
    checks.push({
      id: 'scheduled',
      name: 'Scheduling',
      description: 'Session has a scheduled date and time',
      passed: hasSchedule,
      weight: 35,
      category: 'assignment',
    });

    // Check 3: Session has location assigned (25 points)
    const hasLocation = !!session.locationId;
    checks.push({
      id: 'location-assigned',
      name: 'Location Assignment',
      description: 'Session has a location assigned',
      passed: hasLocation,
      weight: 25,
      category: 'assignment',
    });

    return checks;
  }

  private generateRecommendedActions(checks: ReadinessCheck[]): string[] {
    const failedChecks = checks.filter(check => !check.passed);
    const actions: string[] = [];

    failedChecks.forEach(check => {
      if (check.id === 'all-topics-trainers-assigned') {
        actions.push('Assign trainers to all topics in the session');
      } else if (check.id === 'scheduled') {
        actions.push('Set a date and time for the session');
      } else if (check.id === 'location-assigned') {
        actions.push('Assign a location for the session');
      }
    });

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
    // Return checklist items for building UI forms
    const checklists = {
      assignment: [
        { id: 'all-topics-trainers-assigned', name: 'Trainer Assignment', description: 'Assign trainers to all topics' },
        { id: 'scheduled', name: 'Scheduling', description: 'Set date and time for delivery' },
        { id: 'location-assigned', name: 'Location Assignment', description: 'Assign a location for the session' },
      ],
    };

    return checklists[category] || [];
  }
}
