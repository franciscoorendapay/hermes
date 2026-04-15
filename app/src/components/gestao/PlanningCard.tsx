import { Calendar, CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  estabelecimento: string;
  status: string;
}

interface PlanningStats {
  agendadas: number;
  realizadas: number;
  pendentes: number;
  canceladas: number;
  proximosAgendamentos: Agendamento[];
}

interface PlanningCardProps {
  data: PlanningStats;
  onViewAll?: () => void;
}

export function PlanningCard({ data, onViewAll }: PlanningCardProps) {
  const cumprimento = data.agendadas > 0 
    ? Math.round((data.realizadas / data.agendadas) * 100) 
    : 0;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge variant="default" className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">Realizado</Badge>;
      case 'cancelado':
        return <Badge variant="destructive" className="bg-rose-500/20 text-rose-700 border-rose-500/30">Cancelado</Badge>;
      default:
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-500/30">Pendente</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5 text-primary" />
            Planejamento
          </CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs">
              Ver todos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">Agendadas</span>
            </div>
            <p className="text-xl font-bold text-foreground">{data.agendadas}</p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-3">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-xs">Realizadas</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{data.realizadas}</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-3">
            <div className="flex items-center justify-center gap-1.5 text-amber-600 mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">Pendentes</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{data.pendentes}</p>
          </div>
        </div>

        {/* Barra de Cumprimento */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de Cumprimento</span>
            <span className="font-semibold text-foreground">{cumprimento}%</span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(cumprimento)}`}
              style={{ width: `${Math.min(cumprimento, 100)}%` }}
            />
          </div>
        </div>

        {/* Próximos Agendamentos */}
        {data.proximosAgendamentos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Próximos Agendamentos
            </h4>
            <div className="space-y-2">
              {data.proximosAgendamentos.slice(0, 5).map((agendamento) => (
                <div 
                  key={agendamento.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">
                      {formatDate(agendamento.data)}
                    </span>
                    <span className="text-muted-foreground">{agendamento.hora}</span>
                    <span className="text-foreground truncate max-w-[120px]">
                      {agendamento.estabelecimento}
                    </span>
                  </div>
                  {getStatusBadge(agendamento.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.proximosAgendamentos.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nenhum agendamento no período
          </div>
        )}
      </CardContent>
    </Card>
  );
}
