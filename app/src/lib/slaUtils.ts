/**
 * Calcula a data de entrega baseada em dias úteis
 * @param diasUteis Número de dias úteis a adicionar
 * @returns Data calculada
 */
export const calcularPrazoEntrega = (diasUteis: number): Date => {
  const prazo = new Date();
  let diasAdicionados = 0;
  
  while (diasAdicionados < diasUteis) {
    prazo.setDate(prazo.getDate() + 1);
    const diaSemana = prazo.getDay();
    // Pular fins de semana (0 = domingo, 6 = sábado)
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAdicionados++;
    }
  }
  
  return prazo;
};

/**
 * Verifica se uma ordem está atrasada
 * @param status Status atual da ordem
 * @param prazoEntrega Data limite de entrega
 * @returns true se a ordem está atrasada
 */
export const isOrdemAtrasada = (status: string, prazoEntrega: string | null): boolean => {
  if (status === 'concluida' || status === 'cancelada') return false;
  if (!prazoEntrega) return false;
  return new Date() > new Date(prazoEntrega);
};
