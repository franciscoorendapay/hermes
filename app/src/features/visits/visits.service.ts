import axios from 'axios';
import type { Visit, VisitCreate, VisitUpdate, VisitFilters } from './visits.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const visitsService = {
  /**
   * Fetch all visits with optional filters
   */
  async fetchVisits(filters?: VisitFilters): Promise<Visit[]> {
    const params = new URLSearchParams();

    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.lead_id) params.append('lead_id', filters.lead_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters?.data_fim) params.append('data_fim', filters.data_fim);

    const queryString = params.toString();
    const url = `${API_URL}/visits${queryString ? `?${queryString}` : ''}`;

    const response = await axios.get<Visit[]>(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    return response.data;
  },

  /**
   * Fetch a single visit by ID
   */
  async fetchVisitById(id: string): Promise<Visit> {
    const response = await axios.get<Visit>(`${API_URL}/visits/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    return response.data;
  },

  /**
   * Create a new visit
   */
  async createVisit(data: VisitCreate): Promise<Visit> {
    const response = await axios.post<Visit>(`${API_URL}/visits`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    return response.data;
  },

  /**
   * Update an existing visit
   */
  async updateVisit(id: string, data: VisitUpdate): Promise<Visit> {
    const response = await axios.put<Visit>(`${API_URL}/visits/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    return response.data;
  },

  /**
   * Delete a visit
   */
  async deleteVisit(id: string): Promise<void> {
    await axios.delete(`${API_URL}/visits/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
  },

  /**
   * Fetch all visits for a specific lead
   */
  async fetchLeadVisits(leadId: string): Promise<Visit[]> {
    const response = await axios.get<Visit[]>(`${API_URL}/leads/${leadId}/visits`, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    return response.data;
  },
};
