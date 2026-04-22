import { hermesApi } from "@/shared/api/hermes-http";

export interface MaquinaInventario {
  id?: string;
  serial: string;
  modelo?: string;
  status: string;
  regiao: string;
  email_estabelecimento: string | null;
  ultima_movimentacao: string | null;
  ultima_observacao: string | null;
  usuario: string | null;
}

export interface Movimentacao {
  id?: string;
  serial?: string;
  tipo?: string;
  data?: string;
  usuario?: string;
  observacao?: string;
  [key: string]: unknown;
}

export interface DashboardInventario {
  total_a910?: number;
  total_s920?: number;
  [key: string]: unknown;
  inventario: MaquinaInventario[];
  movimentacoes: Movimentacao[];
}

export interface ListagemResponse {
  inventario: MaquinaInventario[];
  total_paginas: number;
  page: number;
}

export interface ConsultarParams {
  page?: number;
  status?: string;
  regiao?: string;
  q?: string;
}

// Todos os endpoints retornam { dados: "<json-string>" }
const parse = <T>(res: { dados: string }): T => JSON.parse(res.dados) as T;

export const inventarioService = {
  // Totais por modelo + últimas movimentações
  dashboard: async (): Promise<DashboardInventario> => {
    const res = await hermesApi.get<{ dados: string }>("/inventario");
    return parse(res.data);
  },

  // Listagem paginada com filtros opcionais
  consultar: async (params: ConsultarParams = {}): Promise<ListagemResponse> => {
    const p = new URLSearchParams({ acao: "consultar" });
    if (params.page)   p.set("page", String(params.page));
    if (params.status) p.set("status", params.status);
    if (params.regiao) p.set("regiao", params.regiao);
    if (params.q)      p.set("q", params.q);

    const res = await hermesApi.get<{ dados: string }>(`/inventario?${p}`);
    return parse(res.data);
  },

  // Detalhe de uma máquina pelo serial
  buscarMaquina: async (serial: string): Promise<MaquinaInventario> => {
    const res = await hermesApi.get<{ dados: string }>(`/inventario/${serial}`);
    return parse(res.data);
  },

  // Histórico de movimentações de um serial
  historico: async (serial: string): Promise<{ historico: Movimentacao[] }> => {
    const res = await hermesApi.get<{ dados: string }>(`/inventario/${serial}/historico`);
    return parse(res.data);
  },

  // Novo avanço
  postAvanco: async (body: Record<string, unknown>) => {
    const res = await hermesApi.post<{ dados: string }>("/inventario?acao=avanco", body);
    return parse(res.data);
  },

  // Movimentar máquinas
  postMovimentar: async (body: Record<string, unknown>) => {
    const res = await hermesApi.post<{ dados: string }>("/inventario?acao=movimentar", body);
    return parse(res.data);
  },
};
