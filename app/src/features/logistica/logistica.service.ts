import { api } from "@/shared/api/http";

export interface OrdemLogistica {
  id: string;
  tipo: string;
  quantidade: number;
  status: string;
  observacao: string | null;
  created_at: string;
  updated_at: string | null;
  data_atendimento: string | null;
  entregue_no_prazo: boolean | null;
  created_by: { id: string; name: string } | null;
  leads: {
    id: string;
    nome_fantasia: string;
    telefone: string | null;
    endereco_logradouro: string | null;
    endereco_numero: string | null;
    endereco_bairro: string | null;
    endereco_cidade: string | null;
    endereco_estado: string | null;
    endereco_cep: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
}

export interface CriarOrdemPayload {
  tipo: string;
  quantidade: number;
  lead_id?: string;
  observacao?: string | null;
}

export const logisticaService = {
  listarOrdens: async (filters?: {
    status?: string;
    tipo?: string;
    lead_id?: string;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<OrdemLogistica[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.tipo) params.set("tipo", filters.tipo);
    if (filters?.lead_id) params.set("lead_id", filters.lead_id);
    if (filters?.data_inicio) params.set("data_inicio", filters.data_inicio);
    if (filters?.data_fim) params.set("data_fim", filters.data_fim);

    const response = await api.get(`/logistica/ordens?${params.toString()}`);
    return response.data;
  },

  criarOrdem: async (payload: CriarOrdemPayload): Promise<OrdemLogistica> => {
    const response = await api.post("/logistica/ordens", payload);
    return response.data;
  },

  atualizarStatus: async (
    id: string,
    status: string,
    observacao?: string
  ): Promise<OrdemLogistica> => {
    const response = await api.patch(`/logistica/ordens/${id}/status`, {
      status,
      ...(observacao ? { observacao } : {}),
    });
    return response.data;
  },

  stats: async () => {
    const response = await api.get("/logistica/stats");
    return response.data;
  },
};
