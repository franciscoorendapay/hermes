import { api } from "@/shared/api/http";

export interface MaquinaInventario {
  id: string;
  serial: string;
  status: string;
  regiao: string;
  email_estabelecimento: string | null;
  ultima_movimentacao: string | null;
  ultima_observacao: string | null;
  usuario: string | null;
}

export interface ConsultarParams {
  busca?: string;
  status?: string;
  regiao?: string;
  page?: number;
  per_page?: number;
}

export interface ConsultarResponse {
  data: MaquinaInventario[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
}

export const inventarioService = {
  consultar: async (params: ConsultarParams = {}): Promise<ConsultarResponse> => {
    const p = new URLSearchParams();
    if (params.busca) p.set("busca", params.busca);
    if (params.status) p.set("status", params.status);
    if (params.regiao) p.set("regiao", params.regiao);
    if (params.page) p.set("page", String(params.page));
    if (params.per_page) p.set("per_page", String(params.per_page));

    const response = await api.get(`/inventario/maquinas?${p.toString()}`);
    return response.data;
  },
};
