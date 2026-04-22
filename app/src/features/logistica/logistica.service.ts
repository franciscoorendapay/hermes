import { hermesApi } from "@/shared/api/hermes-http";

export interface OrdemLogistica {
  id: string;
  tipo: string;
  quantidade: number;
  status: string;
  observacao: string | null;
  created_at: string;
  updated_at: string | null;
  data_atendimento?: string | null;
  entregue_no_prazo?: boolean | null;
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

interface HermesMaquina {
  id: string;
  serial: string;
  status: string;
  regiao: string;
  email_estabelecimento: string | null;
  ultima_movimentacao: string | null;
  ultima_observacao: string | null;
  usuario: string | null;
}

interface HermesBobina {
  id: string;
  status: string;
  quantidade: number;
  estabelecimento: string | null;
  ultima_movimentacao: string | null;
  observacao: string | null;
  usuario: string | null;
}

interface HermesListResponse<T> {
  data: T[];
  total: number;
}

function resolvetipoMaquina(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("troc")) return "troca_equipamento";
  if (s.includes("retir") || s.includes("pickup")) return "retirada_equipamento";
  return "entrega_equipamento";
}

function resolveStatus(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("andamento") || s.includes("rota")) return "em_andamento";
  if (s.includes("conclu") || s.includes("entregue") || s.includes("ok")) return "concluido";
  if (s.includes("cancelad")) return "cancelado";
  return "pendente";
}

function maquinaToOrdem(m: HermesMaquina): OrdemLogistica {
  return {
    id: m.id,
    tipo: resolvetipoMaquina(m.status),
    quantidade: 1,
    status: resolveStatus(m.status),
    observacao: m.ultima_observacao,
    created_at: m.ultima_movimentacao || new Date().toISOString(),
    updated_at: null,
    created_by: m.usuario ? { id: m.usuario, name: m.usuario } : null,
    leads: {
      id: m.id,
      nome_fantasia: m.email_estabelecimento || `Máquina ${m.serial}`,
      telefone: null,
      endereco_logradouro: null,
      endereco_numero: null,
      endereco_bairro: null,
      endereco_cidade: m.regiao || null,
      endereco_estado: null,
      endereco_cep: null,
      lat: null,
      lng: null,
    },
  };
}

function bobinaToOrdem(b: HermesBobina): OrdemLogistica {
  return {
    id: b.id,
    tipo: "bobinas",
    quantidade: b.quantidade || 1,
    status: resolveStatus(b.status),
    observacao: b.observacao,
    created_at: b.ultima_movimentacao || new Date().toISOString(),
    updated_at: null,
    created_by: b.usuario ? { id: b.usuario, name: b.usuario } : null,
    leads: {
      id: b.id,
      nome_fantasia: b.estabelecimento || "Estabelecimento",
      telefone: null,
      endereco_logradouro: null,
      endereco_numero: null,
      endereco_bairro: null,
      endereco_cidade: null,
      endereco_estado: null,
      endereco_cep: null,
      lat: null,
      lng: null,
    },
  };
}

export const logisticaService = {
  listarOrdens: async (filters?: {
    status?: string;
    tipo?: string;
    lead_id?: string;
    inicio?: string;
    fim?: string;
  }): Promise<OrdemLogistica[]> => {
    const baseParams = new URLSearchParams();
    if (filters?.status)  baseParams.set("status", filters.status);
    if (filters?.lead_id) baseParams.set("lead_id", filters.lead_id);
    if (filters?.inicio)  baseParams.set("inicio", filters.inicio);
    if (filters?.fim)     baseParams.set("fim", filters.fim);

    const isBobinas     = filters?.tipo === "bobinas";
    const isEquipamento = !!filters?.tipo && filters.tipo !== "bobinas";
    const noFilter      = !filters?.tipo;

    const results: OrdemLogistica[] = [];

    if (isBobinas || noFilter) {
      const res = await hermesApi.get<HermesListResponse<HermesBobina>>(
        `/bobinas?${baseParams.toString()}`
      );
      results.push(...(res.data.data ?? []).map(bobinaToOrdem));
    }

    if (isEquipamento || noFilter) {
      const maqParams = new URLSearchParams(baseParams);
      if (isEquipamento) maqParams.set("tipo", filters!.tipo!);
      const res = await hermesApi.get<HermesListResponse<HermesMaquina>>(
        `/maquininhas?${maqParams.toString()}`
      );
      results.push(...(res.data.data ?? []).map(maquinaToOrdem));
    }

    return results;
  },

  criarOrdem: async (payload: CriarOrdemPayload): Promise<OrdemLogistica> => {
    const endpoint = payload.tipo === "bobinas" ? "/bobinas" : "/maquininhas";
    const response = await hermesApi.post(endpoint, payload);
    return payload.tipo === "bobinas"
      ? bobinaToOrdem(response.data)
      : maquinaToOrdem(response.data);
  },

  atualizarStatus: async (
    id: string,
    tipo: string,
    status: string,
    observacao?: string
  ): Promise<OrdemLogistica> => {
    const endpoint = tipo === "bobinas" ? `/bobinas/${id}` : `/maquininhas/${id}`;
    const response = await hermesApi.post(endpoint, {
      action: "atualizar_status",
      status,
      ...(observacao ? { observacao } : {}),
    });
    return tipo === "bobinas"
      ? bobinaToOrdem(response.data)
      : maquinaToOrdem(response.data);
  },

  stats: async () => {
    const [maquinas, bobinas] = await Promise.all([
      hermesApi.get<HermesListResponse<HermesMaquina>>("/maquininhas"),
      hermesApi.get<HermesListResponse<HermesBobina>>("/bobinas"),
    ]);

    const todas = [
      ...(maquinas.data.data ?? []).map(maquinaToOrdem),
      ...(bobinas.data.data ?? []).map(bobinaToOrdem),
    ];

    return {
      pendentes:  todas.filter(o => o.status === "pendente").length,
      emRota:     todas.filter(o => o.status === "em_andamento").length,
      concluidos: todas.filter(o => o.status === "concluido").length,
      total:      todas.length,
    };
  },
};
