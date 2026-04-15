import { useQuery } from "@tanstack/react-query";
import { leadsService } from "@/features/leads/leads.service";
import { adaptLeadApiToApp } from "@/features/leads/leads.adapter";
import { useAuth } from "@/hooks/useAuth";

export interface Lead {
  id: string;
  cod_lead: number;
  user_id: string;
  nome_fantasia: string;
  nome1: string | null; // Contact Person
  razao_social: string | null;
  doc: string | null;
  email: string | null;
  telefone: string | null;
  tpv: string | null;
  data_registro: string | null;
  data_credenciamento: string | null;
  funil_app: number | null;
  credenciado: number | null;
  mcc: string | null;
  segmento: string | null;
  prazo_recebimento: string | null;
  share_debito_pix: number | null;
  share_credito_vista: number | null;
  share_parcelado_2a6: number | null;
  share_parcelado_7a12: number | null;
  endereco_cep: string | null;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  lat: string | null;
  lng: string | null;
  observacao: string | null;
  updated_at: string | null;
  // Rates
  taxa_antecipacao: number | null;
  taxa_pix: number | null;
  visa_debito: number | null;
  visa_credito_vista: number | null;
  visa_parcelado_2a6: number | null;
  visa_parcelado_7a12: number | null;
  visa_parcelado_13a18: number | null;
  master_debito: number | null;
  master_credito_vista: number | null;
  master_parcelado_2a6: number | null;
  master_parcelado_7a12: number | null;
  master_parcelado_13a18: number | null;
  elo_debito: number | null;
  elo_credito_vista: number | null;
  elo_parcelado_2a6: number | null;
  elo_parcelado_7a12: number | null;
  elo_parcelado_13a18: number | null;
  outras_debito: number | null;
  outras_credito_vista: number | null;
  outras_parcelado_2a6: number | null;
  outras_parcelado_7a12: number | null;
  outras_parcelado_13a18: number | null;

  qtd_equipamentos: number | null;

  // New decision maker fields
  is_decision_maker: string | null; // "sim" or "nao"
  nome_tomador_decisao: string | null;

  // Orenda API identifier
  apiToken: string | null;
}

export function useLeads(enabled: boolean = false) {
  const { effectiveUser, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['leads', effectiveUser?.id],
    queryFn: async () => {
      const apiLeads = await leadsService.getAll(effectiveUser?.id);
      return apiLeads.map(adaptLeadApiToApp);
    },
    enabled: enabled && isAuthenticated && !!effectiveUser?.id,
    staleTime: 1000 * 60 * 5, 
  });
}
