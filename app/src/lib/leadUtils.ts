import { DIAS_PARA_FRIO } from "@/constants/funil";

interface LeadWithDates {
  updated_at?: string | null;
  funil_app?: number | null;
}

/**
 * Verifica se um lead está "frio" (sem atividade há mais de X dias)
 * Leads credenciados (5), congelados (6) ou já com cred pendente (7) não são considerados frios
 */
export function isLeadFrio(lead: LeadWithDates, diasLimite = DIAS_PARA_FRIO): boolean {
  // Não marcar como frio se já estiver em status finais
  if (!lead.funil_app || lead.funil_app >= 5) return false;

  if (!lead.updated_at) return false;

  const ultimaAtividade = new Date(lead.updated_at);
  const hoje = new Date();
  const diffMs = hoje.getTime() - ultimaAtividade.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDias > diasLimite;
}

/**
 * Calcula quantos dias o lead está sem atividade
 */
export function diasSemAtividade(updatedAt: string | null | undefined): number {
  if (!updatedAt) return 0;

  const ultimaAtividade = new Date(updatedAt);
  const hoje = new Date();
  const diffMs = hoje.getTime() - ultimaAtividade.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Retorna o status efetivo do lead (considerando se está "frio")
 */
export function getEffectiveFunilId(lead: LeadWithDates & { credenciado?: number | null }): number {
  if (isLeadFrio(lead)) return 8; // Frio

  // Se estiver na etapa de Credenciamento (5) mas não tiver a flag de credenciado (1),
  // então está "Cred. Pendente" (7)
  if (lead.funil_app === 5 && lead.credenciado !== 1) {
    return 7;
  }

  return lead.funil_app || 1;
}
