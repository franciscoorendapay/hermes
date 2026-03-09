import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FUNIL, FUNIL_COLORS } from '@/constants/funil';

interface FunilChartProps {
  data: Record<number, number>;
}

export function FunilChart({ data }: FunilChartProps) {
  const chartData = useMemo(() => {
    return FUNIL.map(stage => ({
      name: stage.label,
      value: data[stage.id] || 0,
      color: FUNIL_COLORS[stage.id] || '#6B7280',
    }));
  }, [data]);

  const total = chartData.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Funil de Vendas</h3>
          <p className="text-sm text-muted-foreground">Distribuição dos leads por etapa</p>
        </div>
        <span className="text-2xl font-bold text-foreground">{total}</span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">
              {item.name}: <span className="font-medium text-foreground">{item.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
