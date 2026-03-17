import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FUNIL, FUNIL_COLORS } from '@/constants/funil';

interface FunilOverviewCardProps {
  data: Record<number, number>;
  isLoading?: boolean;
}

export function FunilOverviewCard({ data, isLoading = false }: FunilOverviewCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            🎯 Funil de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-28 h-4 bg-muted/20 rounded animate-pulse" />
                <div className="flex-1 h-8 bg-muted/20 rounded-lg animate-pulse" />
                <div className="w-12 h-4 bg-muted/20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular total para percentuais
  const total = Object.values(data).reduce((acc, val) => acc + val, 0);

  // Preparar dados ordenados por etapa do funil (ordem de vendas)
  const stages = FUNIL.map(stage => ({
    id: stage.id,
    label: stage.label,
    value: data[stage.id] || 0,
    color: FUNIL_COLORS[stage.id] || '#6B7280',
    percentage: total > 0 ? Math.round(((data[stage.id] || 0) / total) * 100) : 0,
  }));

  // Encontrar o valor máximo para escala das barras
  const maxValue = Math.max(...stages.map(s => s.value), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🎯 Funil de Vendas
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {total} leads total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-28 text-sm text-muted-foreground truncate">
                {stage.label}
              </div>

              {/* Barra de progresso */}
              <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                  style={{
                    width: `${Math.max((stage.value / maxValue) * 100, 8)}%`,
                    backgroundColor: stage.color,
                  }}
                >
                  {stage.value > 0 && (
                    <span className="text-xs font-bold text-white drop-shadow-sm">
                      {stage.value}
                    </span>
                  )}
                </div>
              </div>

              {/* Percentual */}
              <div className="w-12 text-right text-sm font-medium text-muted-foreground">
                {stage.percentage}%
              </div>
            </div>
          ))}
        </div>

        {/* Legenda de conversão */}
        {total > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxa de conversão (Credenciados/Total)</span>
              <span className="font-bold text-green-600">
                {Math.round(((data[5] || 0) / total) * 100)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
