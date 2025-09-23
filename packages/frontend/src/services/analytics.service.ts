import axios from 'axios';
import { API_ENDPOINTS } from '@leadership-training/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AnalyticsOverviewResponse {
  totalSessions: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  totalRegistrations: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  averageAttendance: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  activeTrainers: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
}

class AnalyticsService {
  private api = api;

  constructor() {
    // Add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
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
          // Handle unauthorized - redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async getOverview(dateRange: string = 'last-30-days'): Promise<AnalyticsOverviewResponse> {
    const response = await this.api.get(`${API_ENDPOINTS.ANALYTICS}/overview`, {
      params: { dateRange }
    });
    return response.data;
  }

  async getSessionPerformance(params: any) {
    const response = await this.api.get(`${API_ENDPOINTS.ANALYTICS}/sessions/performance`, {
      params
    });
    return response.data;
  }

  async getSessionTrends(params: any) {
    const response = await this.api.get(`${API_ENDPOINTS.ANALYTICS}/sessions/trends`, {
      params
    });
    return response.data;
  }

  async getTopicsPopularity(params: any) {
    const response = await this.api.get(`${API_ENDPOINTS.ANALYTICS}/topics/popularity`, {
      params
    });
    return response.data;
  }

  async getTrainersPerformance(params: any) {
    const response = await this.api.get(`${API_ENDPOINTS.ANALYTICS}/trainers/performance`, {
      params
    });
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();