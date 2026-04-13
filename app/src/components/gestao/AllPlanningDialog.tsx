import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { http } from '@/shared/api/http';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatMoney } from '@/lib/formatters';

interface Agendamento {
  id: string;
  data_lembrete: string;
  hora_lembrete: string;
  estabelecimento_nome: string | null;
  status: string;
  descricao: string | null;
  created_at: string;
  lead_id: string | null;
  tpv: number | null;
}

interface AllPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

type PeriodTab = 'hoje' | 'amanha' | 'semana' | 'mes';

export function AllPlanningDialog({ open, onOpenChange, userId }: AllPlanningDialogProps) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodTab, setPeriodTab] = useState<PeriodTab>('mes');
  const [statusTab, setStatusTab] = useState('todos');

  useEffect(() => {
    if (open && userId) {
      fetchAgendamentos();
    }
  }, [open, userId]);

  const fetchAgendamentos = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await http.get(`/reminders?user_ids=${userId}`);
      const data = response.data || [];

      // Mapear dados e extrair TPV do lead
      const mapped = data.map((item: any) => ({
        id: String(item.id),
        data_lembrete: item.data_lembrete || item.dataLembrete,
        hora_lembrete: item.hora_lembrete || item.horaLembrete,
        estabelecimento_nome: item.estabelecimento_nome || item.estabelecimentoNome,
        status: item.status,
        descricao: item.descricao,
        created_at: item.created_at || item.createdAt,
        lead_id: item.lead?.id || item.lead_id,
        tpv: item.lead?.tpv || null,
      }));

      // Filtrar somente o mês atual
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString().split('T')[0];
      const monthEnd = endOfMonth(now).toISOString().split('T')[0];
      const currentMonth = mapped.filter((a: Agendamento) =>
        a.data_lembrete >= monthStart && a.data_lembrete <= monthEnd
      );

      const deduplicated = deduplicateAgendamentos(currentMonth);
      setAgendamentos(deduplicated);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const deduplicateAgendamentos = (items: Agendamento[]): Agendamento[] => {
    const statusPriority: Record<string, number> = {
      'pendente': 1,
      'concluido': 2,
      'cancelado': 3
    };

    // Agrupar por estabelecimento_nome + data_lembrete
    const grouped = items.reduce((acc, item) => {
      const key = `${item.estabelecimento_nome || 'sem-nome'}_${item.data_lembrete}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, Agendamento[]>);

    // Selecionar o melhor de cada grupo e manter ordem original
    return Object.values(grouped)
      .map(group => {
        return group.sort((a, b) => {
          // Priorizar registros com lead_id
          if (a.lead_id && !b.lead_id) return -1;
          if (!a.lead_id && b.lead_id) return 1;
          // Depois por prioridade de status
          const priorityDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })[0];
      })
      .sort((a, b) => {
        const dateCompare = a.data_lembrete.localeCompare(b.data_lembrete);
        if (dateCompare !== 0) return dateCompare;
        return (a.hora_lembrete || '').localeCompare(b.hora_lembrete || '');
      });
  };

  // Filtrar por período (agendamentos já limitados ao mês atual)
  const filteredByPeriod = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    return agendamentos.filter(a => {
      const date = parseISO(a.data_lembrete);
      switch (periodTab) {
        case 'hoje':
          return isToday(date);
        case 'amanha':
          return isTomorrow(date);
        case 'semana':
          return a.data_lembrete >= weekStartStr && a.data_lembrete <= weekEndStr;
        case 'mes':
        default:
          return true;
      }
    });
  }, [agendamentos, periodTab]);

  // Filtrar por status
  const filteredAgendamentos = useMemo(() => {
    return filteredByPeriod.filter((a) => {
      if (statusTab === 'todos') return true;
      if (statusTab === 'pendentes') return a.status === 'pendente';
      if (statusTab === 'realizados') return a.status === 'concluido';
      if (statusTab === 'cancelados') return a.status === 'cancelado';
      return true;
    });
  }, [filteredByPeriod, statusTab]);

  // Contadores por período
  const periodCounts = useMemo(() => {
    const now = new Date();
    const weekStartStr = startOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0];
    const weekEndStr = endOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0];
    return {
      hoje: agendamentos.filter(a => isToday(parseISO(a.data_lembrete))).length,
      amanha: agendamentos.filter(a => isTomorrow(parseISO(a.data_lembrete))).length,
      semana: agendamentos.filter(a => a.data_lembrete >= weekStartStr && a.data_lembrete <= weekEndStr).length,
      mes: agendamentos.length,
    };
  }, [agendamentos]);

  // Contadores por status (baseado no período selecionado)
  const statusCounts = useMemo(() => ({
    todos: filteredByPeriod.length,
    pendentes: filteredByPeriod.filter(a => a.status === 'pendente').length,
    realizados: filteredByPeriod.filter(a => a.status === 'concluido').length,
    cancelados: filteredByPeriod.filter(a => a.status === 'cancelado').length,
  }), [filteredByPeriod]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return (
          <Badge variant="default" className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Realizado
          </Badge>
        );
      case 'cancelado':
        return (
          <Badge variant="destructive" className="bg-rose-500/20 text-rose-700 border-rose-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return 'Hoje';
      if (isTomorrow(date)) return 'Amanhã';
      return format(date, "dd/MM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agendamentos
          </DialogTitle>
        </DialogHeader>

        {/* Tabs de período: Hoje, Amanhã, Semana */}
        <Tabs value={periodTab} onValueChange={(v) => setPeriodTab(v as PeriodTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="hoje" className="text-xs sm:text-sm">
              Hoje ({periodCounts.hoje})
            </TabsTrigger>
            <TabsTrigger value="amanha" className="text-xs sm:text-sm">
              Amanhã ({periodCounts.amanha})
            </TabsTrigger>
            <TabsTrigger value="semana" className="text-xs sm:text-sm">
              Semana ({periodCounts.semana})
            </TabsTrigger>
            <TabsTrigger value="mes" className="text-xs sm:text-sm">
              Mês ({periodCounts.mes})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={periodTab} className="mt-0">
            {/* Tabs de status */}
            <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="todos" className="text-xs">
                  Todos ({statusCounts.todos})
                </TabsTrigger>
                <TabsTrigger value="pendentes" className="text-xs">
                  Pendentes ({statusCounts.pendentes})
                </TabsTrigger>
                <TabsTrigger value="realizados" className="text-xs">
                  Realizados ({statusCounts.realizados})
                </TabsTrigger>
                <TabsTrigger value="cancelados" className="text-xs">
                  Cancelados ({statusCounts.cancelados})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={statusTab} className="mt-0">
                <ScrollArea className="h-[400px]">
                  {loading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      Carregando agendamentos...
                    </div>
                  ) : filteredAgendamentos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mb-2 opacity-50" />
                      <p>Nenhum agendamento encontrado</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Data</TableHead>
                          <TableHead>Estabelecimento</TableHead>
                          <TableHead className="w-[100px]">TPV</TableHead>
                          <TableHead className="w-[120px]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAgendamentos.map((agendamento) => (
                          <TableRow key={agendamento.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {formatDate(agendamento.data_lembrete)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate max-w-[200px]">
                                  {agendamento.estabelecimento_nome || 'Não informado'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {agendamento.tpv ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  {formatMoney(agendamento.tpv)}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">--</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(agendamento.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
