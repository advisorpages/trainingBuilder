import axios from 'axios';
import { Session, RegistrationRequest } from '@leadership-training/shared';
import { API_ENDPOINTS } from '@leadership-training/shared';
import { api } from './api.service';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export interface SessionTopicAssignmentPayload {
  topicId: number;
  sequenceOrder?: number;
  durationMinutes?: number;
  trainerId?: number;
  notes?: string;
}

export interface CreateSessionRequest {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  locationId?: number;
  audienceId?: number;
  toneId?: number;
  marketingToneId?: number;
  categoryId?: number;
  topicIds?: number[];
  maxRegistrations: number;
  sessionTopics?: SessionTopicAssignmentPayload[];
}

export interface UpdateSessionRequest extends Partial<CreateSessionRequest> {
  sessionTopics?: SessionTopicAssignmentPayload[];
}

export interface StatusUpdateRequest {
  status: string;
  reason?: string;
}

class SessionService {
  // Use shared api client (with auth + 401 handling) for consistency
  private readonly base = `${API_BASE_URL}${API_ENDPOINTS.SESSIONS.BASE}`;

  async createSession(data: CreateSessionRequest): Promise<Session> {
    const response = await api.post<Session>(`${this.base}/`, data);
    return response.data;
  }

  async updateSession(id: string, data: UpdateSessionRequest): Promise<Session> {
    const response = await api.patch<Session>(`${this.base}/${id}`, data);
    return response.data;
  }

  async getSession(id: string): Promise<Session> {
    const response = await api.get<Session>(`${this.base}/${id}`);
    return response.data;
  }

  async getSessions(): Promise<Session[]> {
    const response = await api.get<Session[]>(`${this.base}/`);
    return response.data;
  }

  async deleteSession(id: string): Promise<void> {
    await api.delete(`${this.base}/${id}`);
  }

  async getSessionsByAuthor(authorId: string): Promise<Session[]> {
    const response = await api.get<Session[]>(`${this.base}/author/${authorId}`);
    return response.data;
  }

  // Draft-specific methods for Story 2.2
  async saveDraft(id: string, data: UpdateSessionRequest): Promise<Session> {
    const response = await api.patch<Session>(`${this.base}/${id}/draft`, data);
    return response.data;
  }

  async getMyDrafts(): Promise<Session[]> {
    const response = await api.get<Session[]>(`${this.base}/drafts/my`);
    return response.data;
  }

  async autoSaveDraft(id: string, partialData: Partial<UpdateSessionRequest>): Promise<{ success: boolean; lastSaved: Date }> {
    const response = await api.post<{ success: boolean; lastSaved: string }>(
      `${this.base}/${id}/auto-save`,
      partialData
    );
    return {
      success: response.data.success,
      lastSaved: new Date(response.data.lastSaved)
    };
  }

  async isDraftSaveable(id: string): Promise<boolean> {
    const response = await api.get<{ saveable: boolean }>(`${this.base}/${id}/saveable`);
    return response.data.saveable;
  }

  // Status update methods for Story 3.2
  async updateSessionStatus(id: string, statusUpdate: StatusUpdateRequest): Promise<Session> {
    const response = await api.patch<Session>(`${this.base}/${id}/status`, statusUpdate);
    return response.data;
  }

  async getSessionStatusHistory(id: string): Promise<Array<Record<string, any>>> {
    const response = await api.get<Array<Record<string, any>>>(`${this.base}/${id}/status-history`);
    return response.data;
  }

  async validateSessionContent(id: string): Promise<Record<string, any>> {
    const response = await api.get<Record<string, any>>(`${this.base}/${id}/validation`);
    return response.data;
  }

  async publishSession(id: string): Promise<Session> {
    const response = await api.post<Session>(`${this.base}/${id}/publish`);
    return response.data;
  }

  async bulkArchive(sessionIds: string[]): Promise<{ archived: number }> {
    const response = await api.post<{ archived: number }>(`${this.base}/bulk/archive`, { sessionIds });
    return response.data;
  }

  async bulkUpdateStatus(sessionIds: string[], status: string): Promise<{ updated: number }> {
    try {
      console.log('Frontend service - bulkUpdateStatus called with:', { sessionIds, status });

      // Validate inputs - allow empty string but not null/undefined
      if (status === null || status === undefined) {
        throw new Error('Status is required');
      }

      if (!sessionIds || sessionIds.length === 0) {
        throw new Error('Session IDs are required');
      }

      const response = await api.post<{ updated: number }>(`${this.base}/bulk/status`, { sessionIds, status });
      console.log('Frontend service - bulkUpdateStatus response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Frontend service - bulkUpdateStatus error:', error);

      // Provide more specific error messages
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Invalid request parameters');
      }

      if (error.response?.status === 500) {
        throw new Error('Server error occurred while updating session status');
      }

      throw new Error(error.response?.data?.message || error.message || 'Failed to update session status');
    }
  }

  async bulkPublish(sessionIds: string[]): Promise<{ published: number; failed: string[] }> {
    try {
      console.log('Frontend service - bulkPublish called with:', { sessionIds });
      const response = await api.post<{ published: number; failed: string[] }>(`${this.base}/bulk/publish`, { sessionIds });
      console.log('Frontend service - bulkPublish response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Frontend service - bulkPublish error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to publish sessions');
    }
  }

  async bulkDelete(sessionIds: string[]): Promise<{ deleted: number }> {
    try {
      console.log('Frontend service - bulkDelete called with:', { sessionIds });
      const response = await api.post<{ deleted: number }>(`${this.base}/bulk/delete`, { sessionIds });
      console.log('Frontend service - bulkDelete response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Frontend service - bulkDelete error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete sessions');
    }
  }

  async getSessionReadiness(sessionId: string): Promise<any> {
    try {
      console.log('Frontend service - getSessionReadiness called for:', sessionId);
      const response = await api.get<any>(`${this.base}/${sessionId}/readiness`);
      console.log('Frontend service - getSessionReadiness response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Frontend service - getSessionReadiness error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get session readiness');
    }
  }

  // Public methods for homepage (no auth required)
  async getPublishedSessions(): Promise<Session[]> {
    const response = await axios.get<Session[]>(`${API_BASE_URL}${API_ENDPOINTS.SESSIONS.PUBLIC}`);
    return response.data;
  }

  async getPublicSession(id: string): Promise<Session> {
    const response = await axios.get<Session>(`${API_BASE_URL}${API_ENDPOINTS.SESSIONS.PUBLIC}/${id}`);
    return response.data;
  }

  async registerForSession(sessionId: string, registrationData: RegistrationRequest): Promise<Record<string, any>> {
    const response = await axios.post<Record<string, any>>(
      `${API_BASE_URL}${API_ENDPOINTS.SESSIONS.BASE}/${sessionId}/register`,
      registrationData
    );
    return response.data;
  }

  // ADD these methods to existing SessionService class (don't modify existing methods)

  async createSessionFromBuilder(sessionData: any): Promise<Session> {
    try {
      // Ensure we mark this as builder-generated
      const builderSessionData = {
        ...sessionData,
        builderGenerated: true,
        sessionOutlineData: sessionData.sessionOutlineData
      };

      const response = await api.post<Session>(`${this.base}/`, builderSessionData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create session from builder');
    }
  }

  async getSessionWithOutline(sessionId: string): Promise<Record<string, any>> {
    try {
      const response = await api.get<Record<string, any>>(`${this.base}/${sessionId}?includeOutline=true`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load session with outline');
    }
  }

  // Helper method to check if session was created with builder
  isBuilderGenerated(
    session: Partial<Session> & { builderGenerated?: boolean; sessionOutlineData?: unknown }
  ): boolean {
    return session.builderGenerated === true || !!session.sessionOutlineData;
  }

  // Get the original outline data if available
  getSessionOutlineData(
    session: Partial<Session> & { sessionOutlineData?: unknown }
  ): any | null {
    return session.sessionOutlineData || null;
  }

  // Update session topics order
  async updateSessionTopics(sessionId: string, sessionTopics: SessionTopicAssignmentPayload[]): Promise<Session> {
    try {
      const response = await api.patch<Session>(`${this.base}/${sessionId}`, { sessionTopics });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update session topics');
    }
  }
}

export const sessionService = new SessionService();
