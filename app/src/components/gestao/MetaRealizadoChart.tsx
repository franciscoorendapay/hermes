import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ChartData {
  nome: string;
  meta: number;
  realizado: number;
}

interface MetaRealizadoChartProps {
  data: ChartData[];
  title: string;
  formatType?: 'number' | 'currency';
}

export function MetaRealizadoChart({ data, title, formatType = 'number' }: MetaRealizadoChartProps) {
  const formatValue = (value: number) => {
    if (formatType === 'currency') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value);
    }
    return value.toLocaleString('pt-BR');
  };

  const getBarColor = (realizado: number, meta: number) => {
    if (meta === 0) return 'hsl(var(--muted-foreground))';
    const pct = (realizado / meta) * 100;
    if (pct >= 100) return 'hsl(142, 76%, 36%)'; // green
    if (pct >= 60) return 'hsl(45, 93%, 47%)'; // yellow
    return 'hsl(0, 72%, 51%)'; // red
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const meta = payload.find((p: any) => p.dataKey === 'meta')?.value || 0;
      const realizado = payload.find((p: any) => p.dataKey === 'realizado')?.value || 0;
      const pct = meta > 0 ? Math.round((realizado / meta) * 100) : 0;

      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Meta:</span>
              <span className="font-medium">{formatValue(meta)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Realizado:</span>
              <span className="font-medium">{formatValue(realizado)}</span>
            </p>
            <p className="flex justify-between gap-4 pt-1 border-t">
              <span className="text-muted-foreground">Atingido:</span>
              <span className="font-bold" style={{ color: getBarColor(realizado, meta) }}>
                {pct}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="nome" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatType === 'currency' 
                  ? new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)
                  : value
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
              />
              <Bar 
                dataKey="meta" 
                name="Meta" 
                fill="hsl(var(--muted-foreground))" 
                radius={[4, 4, 0, 0]}
                opacity={0.4}
              />
              <Bar 
                dataKey="realizado" 
                name="Realizado" 
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.realizado, entry.meta)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
