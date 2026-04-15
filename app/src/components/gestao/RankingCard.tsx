import { Trophy, Medal, Award, TrendingUp, Users, Target, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserStats {
  userId: string;
  nome: string;
  leads: {
    total: number;
    credenciados: number;
    tpvTotal: number;
  };
  visitas: {
    total: number;
  };
  metas: {
    metaClientes: number;
    metaValor: number;
    realizadoClientes: number;
    realizadoValor: number;
  };
}

interface RankingCardProps {
  users: UserStats[];
  metric: 'tpv' | 'leads' | 'credenciados' | 'visitas' | 'conversao';
  title: string;
}

const metricConfig = {
  tpv: {
    label: 'TPV',
    icon: TrendingUp,
    getValue: (u: UserStats) => u.leads.tpvTotal,
    format: (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v),
  },
  leads: {
    label: 'Leads',
    icon: Users,
    getValue: (u: UserStats) => u.leads.total,
    format: (v: number) => v.toString(),
  },
  credenciados: {
    label: 'Credenciados',
    icon: Target,
    getValue: (u: UserStats) => u.leads.credenciados,
    format: (v: number) => v.toString(),
  },
  visitas: {
    label: 'Visitas',
    icon: Award,
    getValue: (u: UserStats) => u.visitas.total,
    format: (v: number) => v.toString(),
  },
  conversao: {
    label: 'Conversão',
    icon: Star,
    getValue: (u: UserStats) => u.leads.total > 0 ? (u.leads.credenciados / u.leads.total) * 100 : 0,
    format: (v: number) => `${v.toFixed(1)}%`,
  },
};

const positionStyles = [
  { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600', icon: Trophy },
  { bg: 'bg-slate-400/10', border: 'border-slate-400/30', text: 'text-slate-500', icon: Medal },
  { bg: 'bg-orange-600/10', border: 'border-orange-600/30', text: 'text-orange-600', icon: Medal },
];

export function RankingCard({ users, metric, title }: RankingCardProps) {
  const config = metricConfig[metric];
  const Icon = config.icon;
  
  const rankedUsers = [...users]
    .map(u => ({ ...u, value: config.getValue(u) }))
    .filter(u => u.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topValue = rankedUsers[0]?.value || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rankedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum dado disponível
          </p>
        ) : (
          rankedUsers.map((user, index) => {
            const style = positionStyles[index] || { bg: 'bg-muted/50', border: 'border-border', text: 'text-muted-foreground', icon: null };
            const PositionIcon = style.icon;
            const percentage = topValue > 0 ? (user.value / topValue) * 100 : 0;
            
            return (
              <div
                key={user.userId}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                  style.bg,
                  style.border
                )}
              >
                {/* Position */}
                <div className={cn('flex items-center justify-center w-8 h-8 rounded-full', style.text)}>
                  {PositionIcon ? (
                    <PositionIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}º</span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{user.nome}</span>
                    {index === 0 && (
                      <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-xs">
                        Top Performer
                      </Badge>
                    )}
                    {index === 1 && (
                      <Badge variant="secondary" className="text-xs">
                        2º Lugar
                      </Badge>
                    )}
                    {index === 2 && (
                      <Badge variant="outline" className="text-xs">
                        3º Lugar
                      </Badge>
                    )}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-500' : 'bg-primary/60'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Value */}
                <div className={cn('text-right font-semibold', style.text)}>
                  {config.format(user.value)}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
