import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
  private api = axios.create({
    baseURL: `${API_BASE_URL}/admin/analytics`,
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
          // Handle unauthorized - redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async getOverview(dateRange: string = 'last-30-days'): Promise<AnalyticsOverviewResponse> {
    const response = await this.api.get('/overview', {
      params: { dateRange }
    });
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();