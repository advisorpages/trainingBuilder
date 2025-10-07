import { api } from './api.service';

export interface SystemHealth {
  database: 'connected' | 'disconnected' | 'error';
  api: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  uptime: number;
  version: string;
}

export interface SystemConfig {
  apiTimeout: number;
  maxRequestSize: string;
  environment: string;
  nodeVersion: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: string;
}

class AdminService {
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get<SystemHealth>('/admin/health');
    return response.data;
  }

  async getSystemConfig(): Promise<SystemConfig> {
    const response = await api.get<SystemConfig>('/admin/config');
    return response.data;
  }

  async updateSystemConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    const response = await api.put<SystemConfig>('/admin/config', config);
    return response.data;
  }

  async getLogs(): Promise<LogEntry[]> {
    const response = await api.get<LogEntry[]>('/admin/logs');
    return response.data;
  }
}

export const adminService = new AdminService();