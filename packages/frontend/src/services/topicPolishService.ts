import { api } from './api.service';

export interface PolishComparison {
  topicId: number;
  original: {
    name: string;
    description: string;
    learningOutcomes: string;
    trainerNotes: string;
    materialsNeeded: string;
    deliveryGuidance: string;
  };
  polished: {
    name: string;
    description: string;
    learningOutcomes: string;
    trainerNotes: string;
    materialsNeeded: string;
    deliveryGuidance: string;
  };
  polishedAt: string;
}

export interface ApplyPolishRequest {
  fields: {
    name?: boolean;
    description?: boolean;
    learningOutcomes?: boolean;
    trainerNotes?: boolean;
    materialsNeeded?: boolean;
    deliveryGuidance?: boolean;
  };
  polishedContent: {
    name?: string;
    description?: string;
    learningOutcomes?: string;
    trainerNotes?: string;
    materialsNeeded?: string;
    deliveryGuidance?: string;
  };
}

class TopicPolishService {
  private readonly baseUrl = '/topics';

  /**
   * Get polished content comparison for a topic
   */
  async polishTopic(topicId: number): Promise<PolishComparison> {
    const response = await api.post<PolishComparison>(`${this.baseUrl}/${topicId}/polish`);
    return response.data;
  }

  /**
   * Apply selected polished fields to a topic
   */
  async applyPolishedChanges(topicId: number, request: ApplyPolishRequest): Promise<void> {
    const updates: Record<string, string> = {};

    // Only include fields that are marked for update
    Object.entries(request.fields).forEach(([field, shouldUpdate]) => {
      if (shouldUpdate && request.polishedContent[field as keyof typeof request.polishedContent]) {
        updates[field] = request.polishedContent[field as keyof typeof request.polishedContent]!;
      }
    });

    // Use the existing update endpoint
    await api.patch(`${this.baseUrl}/${topicId}`, updates);
  }

  /**
   * Get field names for display
   */
  getFieldDisplayName(field: string): string {
    const displayNames: Record<string, string> = {
      name: 'Topic Name',
      description: 'Description',
      learningOutcomes: 'Learning Outcomes',
      trainerNotes: 'Trainer Notes',
      materialsNeeded: 'Materials Needed',
      deliveryGuidance: 'Delivery Guidance',
    };

    return displayNames[field] || field;
  }

  /**
   * Check if a field has meaningful changes
   */
  hasChanges(original: string, polished: string): boolean {
    return original.trim() !== polished.trim();
  }

  /**
   * Get all fields that have changes
   */
  getChangedFields(comparison: PolishComparison): string[] {
    const fields = ['name', 'description', 'learningOutcomes', 'trainerNotes', 'materialsNeeded', 'deliveryGuidance'];

    return fields.filter(field =>
      this.hasChanges(
        comparison.original[field as keyof typeof comparison.original],
        comparison.polished[field as keyof typeof comparison.polished]
      )
    );
  }
}

export const topicPolishService = new TopicPolishService();
