import { api } from '@/shared/api/http';
import type { Log, LogFilters, LogStats } from './logs.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const logsService = {
  /**
   * Fetch logs with optional filters
   */
  async fetchLogs(filters?: LogFilters): Promise<{ logs: Log[]; count: number }> {
    const params = new URLSearchParams();

    if (filters?.category) params.append('category', filters.category);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.entity_type) params.append('entity_type', filters.entity_type);
    if (filters?.entity_id) params.append('entity_id', filters.entity_id);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const url = `/admin/logs${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);

    return response.data;
  },

  /**
   * Fetch a single log by ID
   */
  async fetchLogById(id: string): Promise<Log> {
    const response = await api.get(`/admin/logs/${id}`);

    return response.data;
  },

  /**
   * Fetch statistics
   */
  async fetchStats(dateFrom?: string, dateTo?: string): Promise<LogStats> {
    const params = new URLSearchParams();

    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const queryString = params.toString();
    const url = `/admin/logs/stats${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);

    return response.data;
  },

  /**
   * Cleanup old logs
   */
  async cleanup(days: number = 90): Promise<{ deleted_count: number; message: string }> {
    const response = await api.post(`/admin/logs/cleanup?days=${days}`, {});

    return response.data;
  },
};
