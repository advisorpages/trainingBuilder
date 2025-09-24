import axios from 'axios';
import { Session, RegistrationRequest } from '@leadership-training/shared';
import { API_ENDPOINTS } from '@leadership-training/shared';
import { api } from './api.service';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export interface CreateSessionRequest {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  locationId?: number;
  trainerId?: number;
  audienceId?: number;
  toneId?: number;
  categoryId?: number;
  topicIds?: number[];
  maxRegistrations: number;
}

export interface UpdateSessionRequest extends Partial<CreateSessionRequest> {}

export interface StatusUpdateRequest {
  status: string;
  reason?: string;
}

class SessionService {
  // Use shared api client (with auth + 401 handling) for consistency
  private readonly base = `${API_BASE_URL}${API_ENDPOINTS.SESSIONS.BASE}`;

  async createSession(data: CreateSessionRequest): Promise<Session> {
    const response = await api.post(`${this.base}/`, data);
    return response.data;
  }

  async updateSession(id: string, data: UpdateSessionRequest): Promise<Session> {
    const response = await api.patch(`${this.base}/${id}`, data);
    return response.data;
  }

  async getSession(id: string): Promise<Session> {
    const response = await api.get(`${this.base}/${id}`);
    return response.data;
  }

  async getSessions(): Promise<Session[]> {
    const response = await api.get(`${this.base}/`);
    return response.data;
  }

  async deleteSession(id: string): Promise<void> {
    await api.delete(`${this.base}/${id}`);
  }

  async getSessionsByAuthor(authorId: string): Promise<Session[]> {
    const response = await api.get(`${this.base}/author/${authorId}`);
    return response.data;
  }

  // Draft-specific methods for Story 2.2
  async saveDraft(id: string, data: UpdateSessionRequest): Promise<Session> {
    const response = await api.patch(`${this.base}/${id}/draft`, data);
    return response.data;
  }

  async getMyDrafts(): Promise<Session[]> {
    const response = await api.get(`${this.base}/drafts/my`);
    return response.data;
  }

  async autoSaveDraft(id: string, partialData: Partial<UpdateSessionRequest>): Promise<{ success: boolean; lastSaved: Date }> {
    const response = await api.post(`${this.base}/${id}/auto-save`, partialData);
    return response.data;
  }

  async isDraftSaveable(id: string): Promise<boolean> {
    const response = await api.get(`${this.base}/${id}/saveable`);
    return response.data.saveable;
  }

  // Status update methods for Story 3.2
  async updateSessionStatus(id: string, statusUpdate: StatusUpdateRequest): Promise<Session> {
    const response = await api.patch(`${this.base}/${id}/status`, statusUpdate);
    return response.data;
  }

  async getSessionStatusHistory(id: string): Promise<any[]> {
    const response = await api.get(`${this.base}/${id}/status-history`);
    return response.data;
  }

  async validateSessionContent(id: string): Promise<any> {
    const response = await api.get(`${this.base}/${id}/validation`);
    return response.data;
  }

  async publishSession(id: string): Promise<Session> {
    const response = await api.post(`${this.base}/${id}/publish`);
    return response.data;
  }

  // Public methods for homepage (no auth required)
  async getPublishedSessions(): Promise<Session[]> {
    const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.SESSIONS.PUBLIC}`);
    return response.data;
  }

  async getPublicSession(id: string): Promise<Session> {
    const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.SESSIONS.PUBLIC}/${id}`);
    return response.data;
  }

  async registerForSession(sessionId: string, registrationData: RegistrationRequest): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SESSIONS.BASE}/${sessionId}/register`, registrationData);
    return response.data;
  }

  // ADD these methods to existing SessionService class (don't modify existing methods)

  async createSessionFromBuilder(sessionData: any): Promise<any> {
    try {
      // Ensure we mark this as builder-generated
      const builderSessionData = {
        ...sessionData,
        builderGenerated: true,
        sessionOutlineData: sessionData.sessionOutlineData
      };

      const response = await api.post(`${this.base}/`, builderSessionData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create session from builder');
    }
  }

  async getSessionWithOutline(sessionId: string): Promise<any> {
    try {
      const response = await api.get(`${this.base}/${sessionId}?includeOutline=true`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load session with outline');
    }
  }

  // Helper method to check if session was created with builder
  isBuilderGenerated(session: any): boolean {
    return session.builderGenerated === true || !!session.sessionOutlineData;
  }

  // Get the original outline data if available
  getSessionOutlineData(session: any): any | null {
    return session.sessionOutlineData || null;
  }
}

export const sessionService = new SessionService();
