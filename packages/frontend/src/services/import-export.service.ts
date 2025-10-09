import { api } from './api.service';

class ImportExportService {
  async exportSessions(format: 'json' | 'csv' = 'json') {
    const url = format === 'csv' ? '/sessions/export?format=csv' : '/sessions/export';
    const config = format === 'csv' ? { responseType: 'blob' as const } : undefined;
    return api.get(url, config);
  }

  async importSessions(payload: { sessions: any[] }) {
    const response = await api.post<{ total: number; created: number; updated: number; errors: string[] }>(
      '/sessions/import',
      payload,
    );
    return response.data;
  }

  async exportTopics(format: 'json' | 'csv' = 'json') {
    const url = format === 'csv' ? '/topics/export?format=csv' : '/topics/export';
    const config = format === 'csv' ? { responseType: 'blob' as const } : undefined;
    return api.get(url, config);
  }

  async importTopics(payload: { topics: any[] }) {
    const response = await api.post<{ total: number; created: number; updated: number; errors: string[] }>(
      '/topics/import',
      payload,
    );
    return response.data;
  }
}

export const importExportService = new ImportExportService();
