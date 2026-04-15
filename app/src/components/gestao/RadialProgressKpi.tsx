import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RadialProgressKpiProps {
  title: string;
  value: string | number;
  meta?: number;
  realizado?: number;
  icon: LucideIcon;
  formatType?: 'number' | 'currency' | 'percent';
  isLoading?: boolean;
}

export function RadialProgressKpi({
  title,
  value,
  meta = 0,
  realizado = 0,
  icon: Icon,
  formatType = 'number',
  isLoading = false,
}: RadialProgressKpiProps) {
  if (isLoading) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              <div className="w-full h-full rounded-full animate-shimmer shimmer-gradient bg-muted/40" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md animate-shimmer shimmer-gradient bg-muted/40" />
                <div className="h-4 w-20 animate-shimmer shimmer-gradient bg-muted/40 rounded" />
              </div>
              <div className="h-8 w-24 animate-shimmer shimmer-gradient bg-muted/40 rounded" />
              <div className="h-3 w-16 animate-shimmer shimmer-gradient bg-muted/40 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentage = meta > 0 ? Math.min(Math.round((realizado / meta) * 100), 100) : 0;

  // Cores baseadas no percentual
  const getColor = () => {
    if (percentage >= 100) return { stroke: 'stroke-green-500', bg: 'bg-green-500/10', text: 'text-green-600' };
    if (percentage >= 60) return { stroke: 'stroke-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-600' };
    return { stroke: 'stroke-red-500', bg: 'bg-red-500/10', text: 'text-red-600' };
  };

  const colors = getColor();
  const circumference = 2 * Math.PI * 40; // raio de 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const formatValue = (val: number) => {
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Gauge circular */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="40"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className={colors.stroke}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  transition: 'stroke-dashoffset 0.5s ease-in-out',
                }}
              />
            </svg>
            {/* Percentual no centro */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${colors.text}`}>
                {meta > 0 ? `${percentage}%` : '-'}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-md ${colors.bg}`}>
                <Icon className={`h-4 w-4 ${colors.text}`} />
              </div>
              <span className="text-sm text-muted-foreground truncate">{title}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {meta > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Meta: {formatValue(meta)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
