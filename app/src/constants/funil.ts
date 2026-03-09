// Prazo em dias para considerar um lead como "Frio" (sem atividade)
export const DIAS_PARA_FRIO = 30;

export const FUNIL = [
  { id: 1, label: 'Prospecção', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 2, label: 'Qualificação', color: 'bg-yellow-100', textColor: 'text-yellow-700' },
  { id: 3, label: 'Proposta', color: 'bg-purple-100', textColor: 'text-purple-700' },
  { id: 4, label: 'Precificado', color: 'bg-orange-100', textColor: 'text-orange-700' },
  { id: 7, label: 'Cred. Pendente', color: 'bg-amber-100', textColor: 'text-amber-700' },
  { id: 9, label: 'Em Análise', color: 'bg-cyan-100', textColor: 'text-cyan-700' },
  { id: 5, label: 'Credenciado', color: 'bg-green-100', textColor: 'text-green-700' },
  { id: 6, label: 'Congelado', color: 'bg-gray-100', textColor: 'text-gray-600' },
  { id: 8, label: 'Frio', color: 'bg-slate-100', textColor: 'text-slate-600' },
];

export const FUNIL_COLORS: Record<number, string> = {
  1: '#3B82F6', // blue - Prospecção
  2: '#EAB308', // yellow - Qualificação
  3: '#A855F7', // purple - Proposta
  4: '#F97316', // orange - Precificado
  7: '#D97706', // amber - Cred. Pendente
  9: '#06B6D4', // cyan - Em Análise
  5: '#22C55E', // green - Credenciado
  6: '#6B7280', // gray - Congelado
  8: '#64748B', // slate - Frio
};

// Cores específicas para o mapa (agrupando Proposta e Precificado em "Em Negociação")
export const FUNIL_COLORS_MAP: Record<number, string> = {
  1: '#3B82F6', // blue - Prospecção
  2: '#EAB308', // yellow - Qualificação
  3: '#8B5CF6', // violet - Em Negociação (era Proposta)
  4: '#8B5CF6', // violet - Em Negociação (era Precificado)
  7: '#D97706', // amber - Cred. Pendente
  9: '#06B6D4', // cyan - Em Análise
  5: '#22C55E', // green - Credenciado
  6: '#6B7280', // gray - Congelado
  8: '#64748B', // slate - Frio
};

// Labels específicos para o mapa
export const FUNIL_LABELS_MAP: Record<number, string> = {
  1: 'Prospecção',
  2: 'Qualificação',
  3: 'Em Negociação',
  4: 'Em Negociação',
  5: 'Credenciado',
  6: 'Congelado',
  7: 'Cred. Pendente',
  8: 'Frio',
  9: 'Em Análise',
};

// Itens únicos para a legenda do mapa (sem duplicar "Em Negociação")
export const FUNIL_MAP_LEGEND = [
  { id: 1, label: 'Prospecção' },
  { id: 2, label: 'Qualificação' },
  { id: 3, label: 'Em Negociação' },
  { id: 7, label: 'Cred. Pendente' },
  { id: 9, label: 'Em Análise' },
  { id: 5, label: 'Credenciado' },
];
