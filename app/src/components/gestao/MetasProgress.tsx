import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Target, Users, MapPin } from 'lucide-react';

interface MetaItem {
  label: string;
  meta: number;
  realizado: number;
  icon: React.ReactNode;
  format?: 'number' | 'currency';
}

interface MetasProgressProps {
  metas: {
    metaClientes: number;
    metaValor: number;
    metaVisitas: number;
    realizadoClientes: number;
    realizadoValor: number;
    realizadoVisitas: number;
  };
}

export function MetasProgress({ metas }: MetasProgressProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const items: MetaItem[] = [
    {
      label: 'Clientes Credenciados',
      meta: metas.metaClientes,
      realizado: metas.realizadoClientes,
      icon: <Users className="h-5 w-5" />,
      format: 'number',
    },
    {
      label: 'TPV Total',
      meta: metas.metaValor,
      realizado: metas.realizadoValor,
      icon: <Target className="h-5 w-5" />,
      format: 'currency',
    },
    {
      label: 'Visitas Realizadas',
      meta: metas.metaVisitas,
      realizado: metas.realizadoVisitas,
      icon: <MapPin className="h-5 w-5" />,
      format: 'number',
    },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Progresso das Metas</h3>
      
      <div className="space-y-6">
        {items.map((item) => {
          const percentage = item.meta > 0 ? Math.min((item.realizado / item.meta) * 100, 100) : 0;
          const isCompleted = percentage >= 100;
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'p-2 rounded-lg',
                    isCompleted ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'
                  )}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-foreground">
                    {item.format === 'currency' ? formatCurrency(item.realizado) : item.realizado}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {' / '}
                    {item.format === 'currency' ? formatCurrency(item.meta) : item.meta}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Progress 
                  value={percentage} 
                  className={cn(
                    'h-2 flex-1',
                    isCompleted && '[&>div]:bg-emerald-500'
                  )} 
                />
                <span className={cn(
                  'text-sm font-medium w-12 text-right',
                  isCompleted ? 'text-emerald-600' : 'text-muted-foreground'
                )}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
