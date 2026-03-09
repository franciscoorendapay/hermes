import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, MapPin } from 'lucide-react';

interface MetasProgressCardProps {
  metaClientes: number;
  realizadoClientes: number;
  metaValor: number;
  realizadoValor: number;
  metaVisitas: number;
  realizadoVisitas: number;
}

export function MetasProgressCard({
  metaClientes,
  realizadoClientes,
  metaValor,
  realizadoValor,
  metaVisitas,
  realizadoVisitas,
}: MetasProgressCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const metas = [
    {
      label: 'Meta Clientes',
      icon: Target,
      meta: metaClientes,
      realizado: realizadoClientes,
      format: (v: number) => v.toString(),
    },
    {
      label: 'Meta TPV',
      icon: TrendingUp,
      meta: metaValor,
      realizado: realizadoValor,
      format: formatCurrency,
    },
    {
      label: 'Meta Visitas',
      icon: MapPin,
      meta: metaVisitas,
      realizado: realizadoVisitas,
      format: (v: number) => v.toString(),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Progresso das Metas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metas.map((item) => {
          const percentage = item.meta > 0 ? Math.round((item.realizado / item.meta) * 100) : 0;
          const displayPercentage = Math.min(percentage, 100);
          const Icon = item.icon;

          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className={`text-sm font-bold ${getTextColor(percentage)}`}>
                  {percentage}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={displayPercentage} 
                  className="h-3"
                />
                <div 
                  className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(percentage)}`}
                  style={{ width: `${displayPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Realizado: {item.format(item.realizado)}</span>
                <span>Meta: {item.format(item.meta)}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
