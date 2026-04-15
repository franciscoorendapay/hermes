export interface Visit {
  id: string;
  lead: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
  tipo: 'primeira_visita' | 'retorno' | 'entrega' | 'retirada' | 'alteracao_sistema';
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  data_visita: string;
  lat: string | null;
  lng: string | null;
  endereco_visita: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitCreate {
  lead_id: string;
  tipo: string;
  status: string;
  data_visita?: string;
  lat?: string | null;
  lng?: string | null;
  endereco_visita?: string | null;
  observacao?: string | null;
}

export interface VisitUpdate {
  tipo?: string;
  status?: string;
  data_visita?: string;
  lat?: string | null;
  lng?: string | null;
  endereco_visita?: string | null;
  observacao?: string | null;
}

export interface VisitFilters {
  user_id?: string;
  lead_id?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
}
