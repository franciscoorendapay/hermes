import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface DailyCredenciamento {
  dia: string;
  quantidade: number;
  tpv: number;
}

interface DailyCredenciamentosChartProps {
  data: DailyCredenciamento[];
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-1">{label}</p>
        <p className="text-sm text-muted-foreground">
          Credenciamentos: <span className="font-bold text-green-600">{payload[0].value}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          TPV: <span className="font-bold text-green-600">{formatCurrency(payload[0].payload.tpv)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function DailyCredenciamentosChart({ data = [], isLoading = false }: DailyCredenciamentosChartProps) {
  const hasData = data && data.length > 0;
  const total = data.reduce((acc, d) => acc + d.quantidade, 0);
  const totalTpv = data.reduce((acc, d) => acc + d.tpv, 0);

  // Calcular credenciados hoje
  const hoje = format(new Date(), 'dd/MM');
  const credenciadosHoje = data.find(d => d.dia === hoje)?.quantidade ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          📈 Credenciamentos por Dia
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {total} total • {formatCurrency(totalTpv)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 flex-1 flex flex-col">
        <div className="flex gap-4 items-stretch flex-1">
          {/* Mini card "Credenciados Hoje" */}
          <div className="flex-shrink-0 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">HOJE</span>
            <span className="text-4xl font-bold text-green-600 dark:text-green-400 my-1">{credenciadosHoje}</span>
            <span className="text-[10px] text-muted-foreground">{format(new Date(), 'dd/MM/yy')}</span>
          </div>

          {/* Gráfico */}
          <div className="flex-1 min-w-0 flex flex-col">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-end gap-2 p-2">
                <div className="flex-1 w-full flex items-end gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="flex-1 bg-muted/20 rounded-t animate-pulse" style={{ height: `${Math.random() * 50 + 20}%` }} />
                  ))}
                </div>
                <div className="w-full h-4 bg-muted/20 rounded animate-pulse" />
              </div>
            ) : hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    className="text-muted-foreground"
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="quantidade"
                    fill="#22C55E"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Nenhum credenciamento no período
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
