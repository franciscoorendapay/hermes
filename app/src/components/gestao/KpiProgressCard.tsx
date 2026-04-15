import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface KpiProgressCardProps {
  title: string;
  value: string | number;
  meta?: number;
  realizado?: number;
  icon: LucideIcon;
  formatType?: 'number' | 'currency' | 'percent';
}

export function KpiProgressCard({ 
  title, 
  value, 
  meta, 
  realizado, 
  icon: Icon,
  formatType = 'number'
}: KpiProgressCardProps) {
  const hasProgress = meta !== undefined && meta > 0 && realizado !== undefined;
  const percentage = hasProgress ? Math.min(Math.round((realizado / meta) * 100), 100) : 0;
  const percentageDisplay = hasProgress ? Math.round((realizado / meta) * 100) : 0;

  const getStatusColor = (pct: number) => {
    if (pct >= 100) return 'text-green-600';
    if (pct >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-green-500';
    if (pct >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatMeta = (val: number) => {
    if (formatType === 'currency') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(val);
    }
    return val.toLocaleString('pt-BR');
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground">
                {value}
              </span>
              {hasProgress && (
                <span className="text-sm text-muted-foreground">
                  / {formatMeta(meta)}
                </span>
              )}
            </div>
            
            {hasProgress && (
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Progresso</span>
                  <span className={cn("text-xs font-semibold", getStatusColor(percentageDisplay))}>
                    {percentageDisplay}%
                  </span>
                </div>
                <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("absolute h-full rounded-full transition-all duration-500", getProgressColor(percentageDisplay))}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
