import { Trophy, Crown, Flame, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

interface TopPerformersHighlightProps {
  users: UserStats[];
}

export function TopPerformersHighlight({ users }: TopPerformersHighlightProps) {
  // Find top performers in different categories
  const topByTpv = [...users].sort((a, b) => b.leads.tpvTotal - a.leads.tpvTotal)[0];
  const topByCredenciados = [...users].sort((a, b) => b.leads.credenciados - a.leads.credenciados)[0];
  const topByVisitas = [...users].sort((a, b) => b.visitas.total - a.visitas.total)[0];
  const topByConversao = [...users]
    .filter(u => u.leads.total >= 5) // Minimum leads for conversion rate
    .sort((a, b) => {
      const convA = a.leads.total > 0 ? a.leads.credenciados / a.leads.total : 0;
      const convB = b.leads.total > 0 ? b.leads.credenciados / b.leads.total : 0;
      return convB - convA;
    })[0];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);

  const highlights = [
    {
      title: 'Maior Faturamento',
      user: topByTpv,
      value: topByTpv ? formatCurrency(topByTpv.leads.tpvTotal) : '-',
      icon: Crown,
      gradient: 'from-amber-500 to-yellow-600',
      bgGradient: 'from-amber-500/10 to-yellow-600/10',
    },
    {
      title: 'Mais Credenciamentos',
      user: topByCredenciados,
      value: topByCredenciados ? `${topByCredenciados.leads.credenciados} clientes` : '-',
      icon: Trophy,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-500/10 to-teal-600/10',
    },
    {
      title: 'Mais Visitas',
      user: topByVisitas,
      value: topByVisitas ? `${topByVisitas.visitas.total} visitas` : '-',
      icon: Flame,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-500/10 to-red-600/10',
    },
    {
      title: 'Melhor Conversão',
      user: topByConversao,
      value: topByConversao && topByConversao.leads.total > 0
        ? `${((topByConversao.leads.credenciados / topByConversao.leads.total) * 100).toFixed(1)}%`
        : '-',
      icon: Zap,
      gradient: 'from-purple-500 to-indigo-600',
      bgGradient: 'from-purple-500/10 to-indigo-600/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {highlights.map((highlight, index) => {
        const Icon = highlight.icon;
        const hasUser = highlight.user && highlight.value !== '-';
        
        return (
          <Card 
            key={index} 
            className={cn(
              'relative overflow-hidden border-0',
              `bg-gradient-to-br ${highlight.bgGradient}`
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'text-xs font-medium bg-white/80 dark:bg-black/30',
                      `text-transparent bg-clip-text bg-gradient-to-r ${highlight.gradient}`
                    )}
                  >
                    {highlight.title}
                  </Badge>
                  
                  {hasUser ? (
                    <>
                      <p className="font-bold text-lg text-foreground truncate max-w-[140px]">
                        {highlight.user?.nome}
                      </p>
                      <p className={cn(
                        'text-sm font-semibold',
                        `text-transparent bg-clip-text bg-gradient-to-r ${highlight.gradient}`
                      )}>
                        {highlight.value}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">
                      Sem dados suficientes
                    </p>
                  )}
                </div>
                
                <div className={cn(
                  'p-2 rounded-xl',
                  `bg-gradient-to-br ${highlight.gradient}`
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
