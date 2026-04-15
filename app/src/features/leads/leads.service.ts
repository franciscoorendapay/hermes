import { api } from "@/shared/api/http";
import { LeadAPI, LeadApiSchema } from "./leads.schemas";
import { z } from "zod";

export const leadsService = {
  getAll: async (userId?: string): Promise<LeadAPI[]> => {
    const params = userId ? { user_ids: userId } : {};
    const response = await api.get('/leads', { params });
    // Validate array of leads
    return z.array(LeadApiSchema).parse(response.data);
  },

  getById: async (id: string | number): Promise<LeadAPI> => {
    const response = await api.get(`/leads/${id}`);

    console.log(response.data);
    return LeadApiSchema.parse(response.data);
  },

  create: async (lead: Partial<LeadAPI>): Promise<LeadAPI> => {
    const response = await api.post('/leads', lead);
    return LeadApiSchema.parse(response.data);
  },

  update: async (id: string | number, lead: Partial<LeadAPI>): Promise<LeadAPI> => {
    const response = await api.patch(`/leads/${id}`, lead);
    return LeadApiSchema.parse(response.data);
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/leads/${id}`);
  }
};
