import { api } from '@/shared/api/http';
import type { Visit, VisitCreate, VisitUpdate, VisitFilters } from './visits.types';

export const visitsService = {
  async fetchVisits(filters?: VisitFilters): Promise<Visit[]> {
    const params = new URLSearchParams();
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.lead_id) params.append('lead_id', filters.lead_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters?.data_fim) params.append('data_fim', filters.data_fim);
    const queryString = params.toString();
    const response = await api.get<Visit[]>(`/visits${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  async fetchVisitById(id: string): Promise<Visit> {
    const response = await api.get<Visit>(`/visits/${id}`);
    return response.data;
  },

  async createVisit(data: VisitCreate): Promise<Visit> {
    const response = await api.post<Visit>('/visits', data);
    return response.data;
  },

  async updateVisit(id: string, data: VisitUpdate): Promise<Visit> {
    const response = await api.put<Visit>(`/visits/${id}`, data);
    return response.data;
  },

  async deleteVisit(id: string): Promise<void> {
    await api.delete(`/visits/${id}`);
  },

  async fetchLeadVisits(leadId: string): Promise<Visit[]> {
    const response = await api.get<Visit[]>(`/leads/${leadId}/visits`);
    return response.data;
  },
};
