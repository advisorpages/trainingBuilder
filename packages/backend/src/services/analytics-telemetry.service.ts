import { Injectable } from '@nestjs/common';

export interface TelemetryEvent {
  id: string;
  eventType: 'ai_prompt_submitted' | 'ai_content_generated' | 'ai_content_accepted' | 'ai_content_rejected' | 'session_published' | 'builder_opened' | 'content_edited';
  sessionId: string;
  userId?: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface AIInteractionMetrics {
  totalPrompts: number;
  successfulGenerations: number;
  rejectedGenerations: number;
  acceptedGenerations: number;
  averageProcessingTime: number;
  topPromptCategories: { category: string; count: number }[];
  qualityScores: { score: number; count: number }[];
}

export interface BuilderUsageMetrics {
  totalSessions: number;
  sessionsWithAI: number;
  averageBuilderTime: number;
  publishedSessions: number;
  draftSessions: number;
  topUserActions: { action: string; count: number }[];
}

@Injectable()
export class AnalyticsTelemetryService {
  private events: TelemetryEvent[] = [];
  private readonly MAX_EVENTS = 10000; // Keep last 10k events in memory

  recordEvent(eventType: TelemetryEvent['eventType'], data: Omit<TelemetryEvent, 'id' | 'eventType' | 'timestamp'>) {
    const event: TelemetryEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      eventType,
      timestamp: new Date().toISOString(),
      ...data,
    };

    this.events.push(event);

    // Keep only the most recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // In a real implementation, you would persist this to a database or external analytics service
    console.log('Telemetry Event:', JSON.stringify(event));

    return event.id;
  }

  getAIInteractionMetrics(timeRange?: { start: Date; end: Date }): AIInteractionMetrics {
    const relevantEvents = this.filterEventsByTime(
      this.events.filter(e => ['ai_prompt_submitted', 'ai_content_generated', 'ai_content_accepted', 'ai_content_rejected'].includes(e.eventType)),
      timeRange
    );

    const promptEvents = relevantEvents.filter(e => e.eventType === 'ai_prompt_submitted');
    const generationEvents = relevantEvents.filter(e => e.eventType === 'ai_content_generated');
    const acceptedEvents = relevantEvents.filter(e => e.eventType === 'ai_content_accepted');
    const rejectedEvents = relevantEvents.filter(e => e.eventType === 'ai_content_rejected');

    const processingTimes = generationEvents
      .filter(e => e.metadata.processingTime)
      .map(e => e.metadata.processingTime as number);

    const qualityScores = generationEvents
      .filter(e => e.metadata.qualityScore !== undefined)
      .map(e => e.metadata.qualityScore as number);

    // Group quality scores by ranges
    const scoreGroups = qualityScores.reduce((groups, score) => {
      const range = Math.floor(score / 10) * 10;
      const key = `${range}-${range + 9}`;
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);

    // Group prompts by category/kind
    const promptCategories = promptEvents.reduce((groups, event) => {
      const category = event.metadata.kind || 'unknown';
      groups[category] = (groups[category] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);

    return {
      totalPrompts: promptEvents.length,
      successfulGenerations: generationEvents.length,
      rejectedGenerations: rejectedEvents.length,
      acceptedGenerations: acceptedEvents.length,
      averageProcessingTime: processingTimes.length > 0 ?
        Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length) : 0,
      topPromptCategories: Object.entries(promptCategories)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      qualityScores: Object.entries(scoreGroups)
        .map(([range, count]) => ({ score: parseInt(range.split('-')[0]), count }))
        .sort((a, b) => a.score - b.score),
    };
  }

  getBuilderUsageMetrics(timeRange?: { start: Date; end: Date }): BuilderUsageMetrics {
    const relevantEvents = this.filterEventsByTime(this.events, timeRange);

    const sessionOpenEvents = relevantEvents.filter(e => e.eventType === 'builder_opened');
    const publishEvents = relevantEvents.filter(e => e.eventType === 'session_published');
    const editEvents = relevantEvents.filter(e => e.eventType === 'content_edited');
    const aiEvents = relevantEvents.filter(e => e.eventType.startsWith('ai_'));

    // Group sessions with AI usage
    const sessionsWithAI = new Set(aiEvents.map(e => e.sessionId)).size;
    const totalSessions = new Set(relevantEvents.map(e => e.sessionId)).size;

    // Calculate average builder time (mock calculation)
    const builderSessions = sessionOpenEvents.reduce((sessions, event) => {
      if (!sessions[event.sessionId]) {
        sessions[event.sessionId] = { start: event.timestamp, events: 0 };
      }
      sessions[event.sessionId].events++;
      return sessions;
    }, {} as Record<string, { start: string; events: number }>);

    const averageBuilderTime = Object.values(builderSessions).length > 0 ?
      Object.values(builderSessions).reduce((sum, session) => sum + (session.events * 2), 0) / Object.values(builderSessions).length : 0;

    // Top user actions
    const actionCounts = relevantEvents.reduce((counts, event) => {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      totalSessions,
      sessionsWithAI,
      averageBuilderTime: Math.round(averageBuilderTime),
      publishedSessions: publishEvents.length,
      draftSessions: Math.max(0, totalSessions - publishEvents.length),
      topUserActions: Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }

  getRecentEvents(limit: number = 50, eventType?: string): TelemetryEvent[] {
    let filteredEvents = this.events;

    if (eventType) {
      filteredEvents = this.events.filter(e => e.eventType === eventType);
    }

    return filteredEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getEventStats(timeRange?: { start: Date; end: Date }): Record<string, number> {
    const relevantEvents = this.filterEventsByTime(this.events, timeRange);

    return relevantEvents.reduce((stats, event) => {
      stats[event.eventType] = (stats[event.eventType] || 0) + 1;
      stats.total = (stats.total || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
  }

  private filterEventsByTime(events: TelemetryEvent[], timeRange?: { start: Date; end: Date }): TelemetryEvent[] {
    if (!timeRange) return events;

    return events.filter(event => {
      const eventTime = new Date(event.timestamp);
      return eventTime >= timeRange.start && eventTime <= timeRange.end;
    });
  }

  // Method to export events for external analytics services
  exportEvents(format: 'json' | 'csv' = 'json', timeRange?: { start: Date; end: Date }): string {
    const relevantEvents = this.filterEventsByTime(this.events, timeRange);

    if (format === 'csv') {
      const headers = ['id', 'eventType', 'sessionId', 'userId', 'timestamp', 'metadata'];
      const rows = relevantEvents.map(event => [
        event.id,
        event.eventType,
        event.sessionId,
        event.userId || '',
        event.timestamp,
        JSON.stringify(event.metadata),
      ]);

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    return JSON.stringify(relevantEvents, null, 2);
  }

  // Clear old events (for maintenance)
  clearOldEvents(cutoffDate: Date): number {
    const initialCount = this.events.length;
    this.events = this.events.filter(event => new Date(event.timestamp) >= cutoffDate);
    return initialCount - this.events.length;
  }
}