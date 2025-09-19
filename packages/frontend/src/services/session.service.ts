import axios from 'axios';
import { Session, RegistrationRequest } from '../../../shared/src/types';
import { API_ENDPOINTS } from '../../../shared/src/constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
  private api = axios.create({
    baseURL: `${API_BASE_URL}${API_ENDPOINTS.SESSIONS.BASE}`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async createSession(data: CreateSessionRequest): Promise<Session> {
    const response = await this.api.post('/', data);
    return response.data;
  }

  async updateSession(id: string, data: UpdateSessionRequest): Promise<Session> {
    const response = await this.api.patch(`/${id}`, data);
    return response.data;
  }

  async getSession(id: string): Promise<Session> {
    const response = await this.api.get(`/${id}`);
    return response.data;
  }

  async getSessions(): Promise<Session[]> {
    const response = await this.api.get('/');
    return response.data;
  }

  async deleteSession(id: string): Promise<void> {
    await this.api.delete(`/${id}`);
  }

  async getSessionsByAuthor(authorId: string): Promise<Session[]> {
    const response = await this.api.get(`/author/${authorId}`);
    return response.data;
  }

  // Draft-specific methods for Story 2.2
  async saveDraft(id: string, data: UpdateSessionRequest): Promise<Session> {
    const response = await this.api.patch(`/${id}/draft`, data);
    return response.data;
  }

  async getMyDrafts(): Promise<Session[]> {
    const response = await this.api.get('/drafts/my');
    return response.data;
  }

  async autoSaveDraft(id: string, partialData: Partial<UpdateSessionRequest>): Promise<{ success: boolean; lastSaved: Date }> {
    const response = await this.api.post(`/${id}/auto-save`, partialData);
    return response.data;
  }

  async isDraftSaveable(id: string): Promise<boolean> {
    const response = await this.api.get(`/${id}/saveable`);
    return response.data.saveable;
  }

  // Status update methods for Story 3.2
  async updateSessionStatus(id: string, statusUpdate: StatusUpdateRequest): Promise<Session> {
    const response = await this.api.patch(`/${id}/status`, statusUpdate);
    return response.data;
  }

  async getSessionStatusHistory(id: string): Promise<any[]> {
    const response = await this.api.get(`/${id}/status-history`);
    return response.data;
  }

  async validateSessionContent(id: string): Promise<any> {
    const response = await this.api.get(`/${id}/validation`);
    return response.data;
  }

  async publishSession(id: string): Promise<Session> {
    const response = await this.api.post(`/${id}/publish`);
    return response.data;
  }

  // Public methods for homepage (no auth required)
  async getPublishedSessions(): Promise<Session[]> {
    const response = await axios.get(`${API_BASE_URL}/api/sessions/public`);
    return response.data;
  }

  async getPublicSession(id: string): Promise<Session> {
    const response = await axios.get(`${API_BASE_URL}/api/sessions/public/${id}`);
    return response.data;
  }

  async registerForSession(sessionId: string, registrationData: RegistrationRequest): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/api/sessions/${sessionId}/register`, registrationData);
    return response.data;
  }
}

export const sessionService = new SessionService();